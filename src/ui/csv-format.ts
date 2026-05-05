import { billingBasisForEvent, DEFAULT_BILLING_OVERRIDES, type BillingOverrides } from '../pricing/billing.js';
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
    'billing_basis',
    'project',
    'session_id',
] as const;

export function toCsv(events: StoredEvent[], billingOverrides: BillingOverrides = DEFAULT_BILLING_OVERRIDES): string {
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
                billingBasisForEvent(event, billingOverrides),
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