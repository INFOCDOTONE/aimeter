import { describe, expect, it } from 'vitest';
import { buildWindowData } from '../../../ui/dashboard-data.js';
import type { StoredEvent } from '../../../store/schema.js';

describe('dashboard data', () => {
    it('summarizes totals and breakdowns for a selected window', () => {
        const message = buildWindowData(
            [event({ id: 'one', agent: 'claude-code', model: 'claude-sonnet-4', inputTokens: 1000 }), event({ id: 'two', agent: 'codex-cli', model: 'gpt-5', outputTokens: 500 })],
            '7d',
            new Date('2026-05-01T00:00:00.000Z'),
            new Date('2026-05-08T00:00:00.000Z'),
            new Date('2026-05-05T12:00:00.000Z'),
        );

        expect(message.payload.hasEvents).toBe(true);
        expect(message.payload.totals.tokens).toBe(1500);
        expect(message.payload.totals.costUsdEstimated).toBe(0.02);
        expect(message.payload.totals.billing.apiMeteredTokens).toBe(1500);
        expect(message.payload.totals.billing.subscriptionIncludedTokens).toBe(0);
        expect(message.payload.totals.eventCount).toBe(2);
        expect(message.payload.byAgent.map((agent) => agent.label)).toEqual(['Claude Code', 'Codex CLI', 'Gemini CLI']);
        expect(message.payload.byAgent.find((agent) => agent.id === 'gemini-cli')?.tokens).toBe(0);
        expect(message.payload.byModel.map((model) => model.label)).toEqual(['claude-sonnet-4', 'gpt-5']);
        expect(message.payload.daily).toHaveLength(7);
    });

    it('rolls up the lowest confidence level into cost totals', () => {
        const message = buildWindowData(
            [event({ id: 'one', costConfidence: 'high' }), event({ id: 'two', costConfidence: 'low' })],
            'today',
            new Date('2026-05-05T00:00:00.000Z'),
            new Date('2026-05-06T00:00:00.000Z'),
            new Date('2026-05-05T12:00:00.000Z'),
        );

        expect(message.payload.totals.costConfidence).toBe('low');
    });

    it('separates subscription-included usage from API estimated cost', () => {
        const message = buildWindowData(
            [
                event({ id: 'one', agent: 'claude-code', model: 'claude-sonnet-4', inputTokens: 1000, costUsdEstimated: 0.01 }),
                event({ id: 'two', agent: 'codex-cli', model: 'gpt-5', outputTokens: 500, costUsdEstimated: 0.02 }),
            ],
            'today',
            new Date('2026-05-05T00:00:00.000Z'),
            new Date('2026-05-06T00:00:00.000Z'),
            new Date('2026-05-05T12:00:00.000Z'),
            { agentOverrides: { 'claude-code': 'subscription-included' }, modelOverrides: {} },
        );

        expect(message.payload.totals.tokens).toBe(1500);
        expect(message.payload.totals.costUsdEstimated).toBe(0.02);
        expect(message.payload.totals.billing.apiMeteredTokens).toBe(500);
        expect(message.payload.totals.billing.subscriptionIncludedTokens).toBe(1000);
        expect(message.payload.totals.billing.subscriptionIncludedCostUsdEstimated).toBe(0.01);
        expect(message.payload.byAgent.find((agent) => agent.id === 'claude-code')?.billingBasis).toBe('subscription-included');
    });
});

function event(overrides: Partial<StoredEvent>): StoredEvent {
    return {
        id: 'event-id',
        agent: 'claude-code',
        model: 'claude-sonnet-4',
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        costUsdEstimated: 0.01,
        costConfidence: 'high',
        pricingSnapshot: pricingSnapshot(),
        sessionId: 'session',
        projectSlug: 'project',
        occurredAt: '2026-05-05T08:00:00.000Z',
        recordedAt: '2026-05-05T08:00:01.000Z',
        schemaVersion: 1,
        ...overrides,
    };
}

function pricingSnapshot(): StoredEvent['pricingSnapshot'] {
    return {
        inputUsdPerMillion: 3,
        outputUsdPerMillion: 15,
        cacheReadUsdPerMillion: 0.3,
        cacheWriteUsdPerMillion: 3.75,
        verifiedAt: '2026-05-05',
        source: 'catalog',
    };
}