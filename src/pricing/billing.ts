import { z } from 'zod';
import { agentSchema, type Agent } from '../parsers/types.js';
import { normalizeModel } from './compute.js';

export const billingBasisSchema = z.enum(['api-metered', 'subscription-included', 'unknown']);
export type BillingBasis = z.infer<typeof billingBasisSchema>;

export const billingOverridesSchema = z
  .object({
    agentOverrides: z.record(agentSchema, billingBasisSchema),
    modelOverrides: z.record(z.string().min(1), billingBasisSchema),
  })
  .strict();

export type BillingOverrides = z.infer<typeof billingOverridesSchema>;

export const DEFAULT_BILLING_OVERRIDES: BillingOverrides = {
  agentOverrides: {},
  modelOverrides: {},
};

export type BillingClassifiableEvent = {
  agent: Agent;
  model: string;
  pricingSnapshot: {
    source: 'catalog' | 'override' | 'missing';
  };
};

export function billingBasisForEvent(
  event: BillingClassifiableEvent,
  overrides: BillingOverrides = DEFAULT_BILLING_OVERRIDES,
): BillingBasis {
  const normalizedModel = normalizeModel(event.model);
  const modelOverride = overrides.modelOverrides[event.model] ?? overrides.modelOverrides[normalizedModel];
  if (modelOverride !== undefined) {
    return modelOverride;
  }

  const agentOverride = overrides.agentOverrides[event.agent];
  if (agentOverride !== undefined) {
    return agentOverride;
  }

  return event.pricingSnapshot.source === 'missing' ? 'unknown' : 'api-metered';
}
