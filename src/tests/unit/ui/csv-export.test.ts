import { describe, expect, it } from 'vitest';
import type { StoredEvent } from '../../../store/schema.js';
import { toCsv } from '../../../ui/csv-format.js';

describe('toCsv', () => {
    it('exports AIMeter event columns with CSV escaping', () => {
        const csv = toCsv([
            {
                id: 'id-1',
                agent: 'codex-cli',
                model: 'gpt-5',
                inputTokens: 100,
                outputTokens: 50,
                cacheReadTokens: 25,
                cacheWriteTokens: 0,
                costUsdEstimated: 0.00125,
                costConfidence: 'high',
                pricingSnapshot: {
                    inputUsdPerMillion: 1,
                    outputUsdPerMillion: 2,
                    cacheReadUsdPerMillion: 0.1,
                    cacheWriteUsdPerMillion: 0,
                    verifiedAt: '2026-05-05',
                    source: 'catalog',
                },
                sessionId: 'session,alpha',
                projectSlug: 'project',
                occurredAt: '2026-05-05T08:00:00.000Z',
                recordedAt: '2026-05-05T08:00:01.000Z',
                schemaVersion: 1,
            } satisfies StoredEvent,
        ]);

        expect(csv).toBe(
            'timestamp,agent,model,input,output,cache_r,cache_w,cost_usd_estimated,confidence,pricing_source,project,session_id\n' +
            '2026-05-05T08:00:00.000Z,codex-cli,gpt-5,100,50,25,0,0.00125,high,catalog,project,"session,alpha"\n',
        );
    });
});