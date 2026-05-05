import { startOfLocalDay } from '../lib/time.js';
import type { Agent } from '../parsers/types.js';
import type { LocalEventStore } from '../store/persistence.js';
import type { StoredEvent } from '../store/schema.js';
import type {
    CostConfidence,
    DailyUsage,
    UsageBreakdown,
    UsageSession,
    UsageTotals,
    WindowData,
    WindowKey,
} from './webview/messages.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function readWindowData(
    store: LocalEventStore,
    window: WindowKey,
    now = new Date(),
): Promise<WindowData> {
    const range = getWindowRange(window, now);
    const events = await store.readEventsBetween(range.from, range.to);
    return buildWindowData(events, window, range.from, range.to, now);
}

export function buildWindowData(
    events: StoredEvent[],
    window: WindowKey,
    from: Date,
    to: Date,
    now = new Date(),
): WindowData {
    const sortedEvents = [...events].sort(
        (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    );
    const totals = summarizeEvents(events);
    const daily = buildDailyUsage(events, from, to);

    return {
        type: 'window-data',
        payload: {
            window,
            from: from.toISOString(),
            to: to.toISOString(),
            generatedAt: now.toISOString(),
            totals,
            daily,
            byAgent: buildBreakdowns(events, 'agent'),
            byModel: buildBreakdowns(events, 'model'),
            recentSessions: buildRecentSessions(sortedEvents),
            hasEvents: events.length > 0,
        },
    };
}

function getWindowRange(window: WindowKey, now: Date): { from: Date; to: Date } {
    const today = startOfLocalDay(now);
    const dayCount = window === 'today' ? 1 : window === '7d' ? 7 : 30;
    return {
        from: new Date(today.getTime() - (dayCount - 1) * DAY_MS),
        to: new Date(today.getTime() + DAY_MS),
    };
}

function buildDailyUsage(events: StoredEvent[], from: Date, to: Date): DailyUsage[] {
    const days: DailyUsage[] = [];
    for (let cursor = from.getTime(); cursor < to.getTime(); cursor += DAY_MS) {
        const date = new Date(cursor).toISOString().slice(0, 10);
        days.push({ date, tokens: 0, costUsdEstimated: 0, eventCount: 0 });
    }

    const indexByDate = new Map(days.map((day, index) => [day.date, index]));
    for (const event of events) {
        const date = event.occurredAt.slice(0, 10);
        const index = indexByDate.get(date);
        if (index === undefined) {
            continue;
        }
        const day = days[index];
        if (day === undefined) {
            continue;
        }
        day.tokens += totalTokens(event);
        day.costUsdEstimated = roundUsd(day.costUsdEstimated + event.costUsdEstimated);
        day.eventCount += 1;
    }

    return days;
}

function buildBreakdowns(events: StoredEvent[], key: 'agent' | 'model'): UsageBreakdown[] {
    const groups = new Map<string, StoredEvent[]>();
    for (const event of events) {
        const groupKey = key === 'agent' ? event.agent : event.model;
        const group = groups.get(groupKey) ?? [];
        group.push(event);
        groups.set(groupKey, group);
    }

    return [...groups.entries()]
        .map(([id, group]) => ({ id, label: labelForBreakdown(id), ...summarizeEvents(group) }))
        .sort((left, right) => right.tokens - left.tokens || left.label.localeCompare(right.label));
}

function buildRecentSessions(events: StoredEvent[]): UsageSession[] {
    const groups = new Map<string, StoredEvent[]>();
    for (const event of events) {
        const group = groups.get(event.sessionId) ?? [];
        group.push(event);
        groups.set(event.sessionId, group);
    }

    return [...groups.entries()]
        .map(([sessionId, group]) => {
            const latest = group.reduce((winner, event) =>
                new Date(event.occurredAt).getTime() > new Date(winner.occurredAt).getTime() ? event : winner,
            );
            const agents = uniqueSorted(group.map((event) => event.agent));
            const models = uniqueSorted(group.map((event) => event.model));
            return {
                sessionId,
                projectSlug: latest.projectSlug,
                latestAt: latest.occurredAt,
                agents,
                models,
                ...summarizeEvents(group),
            };
        })
        .sort((left, right) => new Date(right.latestAt).getTime() - new Date(left.latestAt).getTime())
        .slice(0, 50);
}

function summarizeEvents(events: StoredEvent[]): UsageTotals {
    const initialSummary: UsageTotals = {
        tokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        costUsdEstimated: 0,
        eventCount: 0,
        costConfidence: 'high',
    };

    return events.reduce<UsageTotals>(
        (summary, event) => ({
            tokens: summary.tokens + totalTokens(event),
            inputTokens: summary.inputTokens + event.inputTokens,
            outputTokens: summary.outputTokens + event.outputTokens,
            cacheReadTokens: summary.cacheReadTokens + event.cacheReadTokens,
            cacheWriteTokens: summary.cacheWriteTokens + event.cacheWriteTokens,
            costUsdEstimated: roundUsd(summary.costUsdEstimated + event.costUsdEstimated),
            eventCount: summary.eventCount + 1,
            costConfidence: combineConfidence(summary.costConfidence, event.costConfidence),
        }),
        initialSummary,
    );
}

function totalTokens(event: StoredEvent): number {
    return event.inputTokens + event.outputTokens + event.cacheReadTokens + event.cacheWriteTokens;
}

function combineConfidence(left: CostConfidence, right: CostConfidence): CostConfidence {
    if (left === 'low' || right === 'low') {
        return 'low';
    }
    if (left === 'medium' || right === 'medium') {
        return 'medium';
    }
    return 'high';
}

function labelForBreakdown(id: string): string {
    const agentLabels: Record<Agent, string> = {
        'claude-code': 'Claude Code',
        'codex-cli': 'Codex CLI',
        'gemini-cli': 'Gemini CLI',
    };
    if (id === 'claude-code' || id === 'codex-cli' || id === 'gemini-cli') {
        return agentLabels[id];
    }
    return id;
}

function uniqueSorted(values: string[]): string[] {
    return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function roundUsd(value: number): number {
    return Math.round(value * 1_000_000) / 1_000_000;
}
