import { describe, expect, it } from 'vitest';
import { billingBasisForEvent } from '../../../pricing/billing.js';

describe('billing basis', () => {
  it('defaults matched catalog usage to API-metered', () => {
    expect(billingBasisForEvent(event({ pricingSource: 'catalog' }))).toBe('api-metered');
  });

  it('defaults missing pricing usage to unknown', () => {
    expect(billingBasisForEvent(event({ pricingSource: 'missing' }))).toBe('unknown');
  });

  it('lets model overrides win over agent overrides', () => {
    expect(
      billingBasisForEvent(event({ model: 'claude-sonnet-4-6' }), {
        agentOverrides: { 'claude-code': 'subscription-included' },
        modelOverrides: { 'claude-sonnet-4-6': 'api-metered' },
      }),
    ).toBe('api-metered');
  });
});

function event(overrides: { model?: string; pricingSource?: 'catalog' | 'override' | 'missing' } = {}) {
  return {
    agent: 'claude-code' as const,
    model: overrides.model ?? 'claude-sonnet-4',
    pricingSnapshot: {
      source: overrides.pricingSource ?? 'catalog',
    },
  };
}