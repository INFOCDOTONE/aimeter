import type { ParsedUsageEvent } from '../parsers/types.js';
import { DEFAULT_CATALOG, type PricingEntry } from './catalog.js';

export type CostConfidence = 'high' | 'medium' | 'low';
export type PricingSource = 'catalog' | 'override' | 'missing';

export type PricingSnapshot = {
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  cacheReadUsdPerMillion: number;
  cacheWriteUsdPerMillion: number;
  verifiedAt: string;
  source: PricingSource;
};

export type PricingOverride = {
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  cacheReadUsdPerMillion: number;
  cacheWriteUsdPerMillion: number;
};

export type PricingOverrides = Record<string, PricingOverride>;

export type EstimatedCost = {
  costUsdEstimated: number;
  costConfidence: CostConfidence;
  pricingSnapshot: PricingSnapshot;
};

export function normalizeModel(model: string): string {
  return model.replace(/-\d{8}$/, '');
}

export function estimateCost(
  event: ParsedUsageEvent,
  catalog = DEFAULT_CATALOG,
  overrides: PricingOverrides = {},
): EstimatedCost {
  const normalized = normalizeModel(event.model);
  const override = overrides[normalized] ?? overrides[event.model];
  if (override !== undefined) {
    return estimateFromEntry(event, {
      provider: providerForAgent(event.agent),
      model: normalized,
      inputUsdPerMillion: override.inputUsdPerMillion,
      outputUsdPerMillion: override.outputUsdPerMillion,
      cacheReadUsdPerMillion: override.cacheReadUsdPerMillion,
      cacheWriteUsdPerMillion: override.cacheWriteUsdPerMillion,
      verifiedAt: new Date().toISOString().slice(0, 10),
      sourceUrl: 'user-override://aimeter-settings',
    }, 'override');
  }

  // Exact match, then fallback: strip trailing minor version (e.g. -6 in claude-sonnet-4-6)
  const withoutMinor = normalized.replace(/-\d{1,2}$/, '');
  const entry =
    catalog.find((candidate) => candidate.model === normalized) ??
    (withoutMinor !== normalized ? catalog.find((candidate) => candidate.model === withoutMinor) : undefined);

  if (!entry) {
    return {
      costUsdEstimated: 0,
      costConfidence: 'low',
      pricingSnapshot: {
        inputUsdPerMillion: 0,
        outputUsdPerMillion: 0,
        cacheReadUsdPerMillion: 0,
        cacheWriteUsdPerMillion: 0,
        verifiedAt: new Date(0).toISOString().slice(0, 10),
        source: 'missing',
      },
    };
  }

  return estimateFromEntry(event, entry, 'catalog');
}

function estimateFromEntry(
  event: ParsedUsageEvent,
  entry: PricingEntry,
  source: PricingSource,
): EstimatedCost {
  const inputCost = (event.inputTokens / 1_000_000) * entry.inputUsdPerMillion;
  const outputCost = (event.outputTokens / 1_000_000) * entry.outputUsdPerMillion;
  const cacheReadCost = (event.cacheReadTokens / 1_000_000) * entry.cacheReadUsdPerMillion;
  const cacheWriteCost = (event.cacheWriteTokens / 1_000_000) * entry.cacheWriteUsdPerMillion;

  return {
    costUsdEstimated: roundUsd(inputCost + outputCost + cacheReadCost + cacheWriteCost),
    costConfidence: source === 'override' ? 'high' : confidenceForVerifiedAt(entry.verifiedAt),
    pricingSnapshot: {
      inputUsdPerMillion: entry.inputUsdPerMillion,
      outputUsdPerMillion: entry.outputUsdPerMillion,
      cacheReadUsdPerMillion: entry.cacheReadUsdPerMillion,
      cacheWriteUsdPerMillion: entry.cacheWriteUsdPerMillion,
      verifiedAt: entry.verifiedAt,
      source,
    },
  };
}

function providerForAgent(agent: ParsedUsageEvent['agent']): PricingEntry['provider'] {
  if (agent === 'codex-cli') {
    return 'openai';
  }
  if (agent === 'gemini-cli') {
    return 'google';
  }
  return 'anthropic';
}

function confidenceForVerifiedAt(verifiedAt: string): CostConfidence {
  const ageMs = Date.now() - new Date(verifiedAt).getTime();
  const ageDays = ageMs / (24 * 60 * 60 * 1000);
  if (ageDays <= 30) {
    return 'high';
  }
  if (ageDays <= 90) {
    return 'medium';
  }
  return 'low';
}

function roundUsd(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
