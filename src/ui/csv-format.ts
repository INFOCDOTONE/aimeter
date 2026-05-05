import type { StoredEvent } from '../store/schema.js';

const COLUMNS = [
    'timestamp',
    'agent',
    'model',
    'input',
    'output',
    'cache_r',
    'cache_w',
    'cost_usd_estimated',
    'confidence',
    'pricing_source',
    'project',
    'session_id',
] as const;

export function toCsv(events: StoredEvent[]): string {
    const rows = events
        .slice()
        .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))
        .map((event) =>
            [
                event.occurredAt,
                event.agent,
                event.model,
                event.inputTokens,
                event.outputTokens,
                event.cacheReadTokens,
                event.cacheWriteTokens,
                event.costUsdEstimated,
                event.costConfidence,
                event.pricingSnapshot.source,
                event.projectSlug,
                event.sessionId,
            ].map((value) => escapeCsv(String(value))),
        );

    return `${COLUMNS.join(',')}\n${rows.map((row) => row.join(',')).join('\n')}${rows.length > 0 ? '\n' : ''}`;
}

function escapeCsv(value: string): string {
    if (!/[",\n\r]/.test(value)) {
        return value;
    }
    return `"${value.replaceAll('"', '""')}"`;
}