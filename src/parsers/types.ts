import { z } from 'zod';

export const agentSchema = z.enum(['claude-code', 'codex-cli', 'gemini-cli']);

export type Agent = z.infer<typeof agentSchema>;

export const parsedUsageEventSchema = z
  .object({
    agent: agentSchema,
    upstreamId: z.string().min(1),
    sessionId: z.string().min(1),
    model: z.string().min(1),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    cacheReadTokens: z.number().int().nonnegative(),
    cacheWriteTokens: z.number().int().nonnegative(),
    occurredAt: z.string().datetime(),
    projectSlug: z.string().min(1),
  })
  .strict();

export type ParsedUsageEvent = z.infer<typeof parsedUsageEventSchema>;

export type ParseResult =
  | {
      ok: true;
      event: ParsedUsageEvent;
    }
  | {
      ok: false;
      reason: string;
    };
