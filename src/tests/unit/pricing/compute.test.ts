import { describe, expect, it } from 'vitest';
import { estimateCost, normalizeModel } from '../../../pricing/compute.js';
import type { ParsedUsageEvent } from '../../../parsers/types.js';

describe('pricing compute', () => {
  it('normalizes dated model suffixes', () => {
    expect(normalizeModel('claude-sonnet-4-20250514')).toBe('claude-sonnet-4');
  });

  it('matches exact minor-version catalog entries', () => {
    const estimate = estimateCost({ ...event(), model: 'claude-sonnet-4-6' });
    expect(estimate.costUsdEstimated).toBeGreaterThan(0);
    expect(estimate.pricingSnapshot.source).toBe('catalog');
  });

  it('prices claude-opus-4-7 with its current exact catalog entry', () => {
    const estimate = estimateCost({ ...event(), model: 'claude-opus-4-7' });
    expect(estimate.costUsdEstimated).toBe(0.03);
    expect(estimate.pricingSnapshot.source).toBe('catalog');
    expect(estimate.pricingSnapshot.inputUsdPerMillion).toBe(5);
  });

  it('does not fall back unknown minor model versions to a different price family', () => {
    const estimate = estimateCost({ ...event(), model: 'claude-opus-4-99' });
    expect(estimate.costUsdEstimated).toBe(0);
    expect(estimate.costConfidence).toBe('low');
    expect(estimate.pricingSnapshot.source).toBe('missing');
  });

  it('matches claude-haiku-4-5-20251001 via date strip', () => {
    const estimate = estimateCost({ ...event(), model: 'claude-haiku-4-5-20251001' });
    expect(estimate.costUsdEstimated).toBeGreaterThan(0);
    expect(estimate.pricingSnapshot.source).toBe('catalog');
  });

  it('computes estimated cost with a snapshot', () => {
    const estimate = estimateCost(event());
    expect(estimate.costUsdEstimated).toBeGreaterThan(0);
    expect(estimate.pricingSnapshot.source).toBe('catalog');
  });

  it('returns low confidence and zero cost for unknown models', () => {
    const estimate = estimateCost({ ...event(), model: 'unknown-model' });
    expect(estimate.costUsdEstimated).toBe(0);
    expect(estimate.costConfidence).toBe('low');
    expect(estimate.pricingSnapshot.source).toBe('missing');
  });

  it('uses user pricing overrides with high confidence', () => {
    const estimate = estimateCost(event(), undefined, {
      'claude-sonnet-4': {
        inputUsdPerMillion: 10,
        outputUsdPerMillion: 20,
        cacheReadUsdPerMillion: 1,
        cacheWriteUsdPerMillion: 2,
      },
    });

    expect(estimate.costUsdEstimated).toBe(0.03);
    expect(estimate.costConfidence).toBe('high');
    expect(estimate.pricingSnapshot.source).toBe('override');
  });
});

function event(): ParsedUsageEvent {
  return {
    agent: 'claude-code',
    upstreamId: 'evt',
    sessionId: 'session',
    model: 'claude-sonnet-4-20250514',
    inputTokens: 1000,
    outputTokens: 1000,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    occurredAt: '2026-05-05T08:00:00.000Z',
    projectSlug: 'project',
  };
}
