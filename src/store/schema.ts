import { z } from 'zod';
import { agentSchema } from '../parsers/types.js';

export const pricingSnapshotSchema = z
  .object({
    inputUsdPerMillion: z.number().nonnegative(),
    outputUsdPerMillion: z.number().nonnegative(),
    cacheReadUsdPerMillion: z.number().nonnegative(),
    cacheWriteUsdPerMillion: z.number().nonnegative(),
    verifiedAt: z.string(),
    source: z.enum(['catalog', 'override', 'missing']),
  })
  .strict();

export const storedEventSchema = z
  .object({
    id: z.string().min(1),
    agent: agentSchema,
    model: z.string().min(1),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    cacheReadTokens: z.number().int().nonnegative(),
    cacheWriteTokens: z.number().int().nonnegative(),
    costUsdEstimated: z.number().nonnegative(),
    costConfidence: z.enum(['high', 'medium', 'low']),
    pricingSnapshot: pricingSnapshotSchema,
    sessionId: z.string().min(1),
    projectSlug: z.string().min(1),
    occurredAt: z.string().datetime(),
    recordedAt: z.string().datetime(),
    schemaVersion: z.literal(1),
  })
  .strict();

export type StoredEvent = z.infer<typeof storedEventSchema>;

export const metaSchema = z
  .object({
    schemaVersion: z.literal(1),
    installId: z.string().uuid(),
    createdAt: z.string().datetime(),
  })
  .strict();

export type StoreMeta = z.infer<typeof metaSchema>;

export const offsetMapSchema = z.record(z.string(), z.number().int().nonnegative());

export type OffsetMap = z.infer<typeof offsetMapSchema>;
