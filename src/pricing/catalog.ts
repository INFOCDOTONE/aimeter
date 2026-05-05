import { z } from 'zod';

export const pricingEntrySchema = z
  .object({
    provider: z.enum(['anthropic', 'openai', 'google']),
    model: z.string().min(1),
    inputUsdPerMillion: z.number().nonnegative(),
    outputUsdPerMillion: z.number().nonnegative(),
    cacheReadUsdPerMillion: z.number().nonnegative(),
    cacheWriteUsdPerMillion: z.number().nonnegative(),
    verifiedAt: z.string().date(),
    sourceUrl: z.string().url(),
  })
  .strict();

export type PricingEntry = z.infer<typeof pricingEntrySchema>;

export const DEFAULT_CATALOG = [
  {
    provider: 'anthropic',
    model: 'claude-sonnet-4',
    inputUsdPerMillion: 3,
    outputUsdPerMillion: 15,
    cacheReadUsdPerMillion: 0.3,
    cacheWriteUsdPerMillion: 3.75,
    verifiedAt: '2026-05-05',
    sourceUrl: 'https://docs.anthropic.com/en/docs/about-claude/pricing',
  },
  {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet',
    inputUsdPerMillion: 3,
    outputUsdPerMillion: 15,
    cacheReadUsdPerMillion: 0.3,
    cacheWriteUsdPerMillion: 3.75,
    verifiedAt: '2026-05-05',
    sourceUrl: 'https://docs.anthropic.com/en/docs/about-claude/pricing',
  },
  {
    provider: 'anthropic',
    model: 'claude-3-5-haiku',
    inputUsdPerMillion: 0.8,
    outputUsdPerMillion: 4,
    cacheReadUsdPerMillion: 0.08,
    cacheWriteUsdPerMillion: 1,
    verifiedAt: '2026-05-05',
    sourceUrl: 'https://docs.anthropic.com/en/docs/about-claude/pricing',
  },
] satisfies PricingEntry[];
