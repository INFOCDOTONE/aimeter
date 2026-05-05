import { z } from 'zod';
import { billingOverridesSchema } from '../pricing/billing.js';

export const settingsSchema = z
  .object({
    statusBar: z.object({
      enabled: z.boolean(),
      format: z.enum(['cost-today', 'tokens-today', 'both']),
    }),
    refreshIntervalSec: z.number().min(5).max(600),
    parsers: z.object({
      claudeCode: z.object({
        enabled: z.boolean(),
        paths: z.array(z.string()),
      }),
      codexCli: z.object({
        enabled: z.boolean(),
        paths: z.array(z.string()),
      }),
      geminiCli: z.object({
        enabled: z.boolean(),
        paths: z.array(z.string()),
      }),
    }),
    retention: z.object({
      days: z.number().min(7).max(3650),
    }),
    pricing: z.object({
      overrides: z.record(
        z
          .object({
            inputUsdPerMillion: z.number().nonnegative(),
            outputUsdPerMillion: z.number().nonnegative(),
            cacheReadUsdPerMillion: z.number().nonnegative(),
            cacheWriteUsdPerMillion: z.number().nonnegative(),
          })
          .strict(),
      ),
    }),
    billing: billingOverridesSchema,
    network: z.object({
      updateCheck: z.boolean(),
    }),
  })
  .strict();

export type AIMeterSettings = z.infer<typeof settingsSchema>;
