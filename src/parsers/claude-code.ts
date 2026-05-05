import path from 'node:path';
import { z } from 'zod';
import type { JsonlParser } from './base.js';
import { normalizeTimestamp, projectSlugFromSource, safeJson } from './helpers.js';
import { parsedUsageEventSchema, type ParseResult } from './types.js';

const usageSchema = z
  .object({
    input_tokens: z.number().int().nonnegative().optional().default(0),
    output_tokens: z.number().int().nonnegative().optional().default(0),
    cache_read_input_tokens: z.number().int().nonnegative().optional().default(0),
    cache_creation_input_tokens: z.number().int().nonnegative().optional().default(0),
  })
  .passthrough();

const claudeLineSchema = z
  .object({
    uuid: z.string().optional(),
    id: z.string().optional(),
    sessionId: z.string().optional(),
    session_id: z.string().optional(),
    timestamp: z.string().optional(),
    created_at: z.string().optional(),
    cwd: z.string().optional(),
    type: z.string().optional(),
    message: z
      .object({
        id: z.string().optional(),
        model: z.string().optional(),
        usage: usageSchema.optional(),
      })
      .passthrough()
      .optional(),
    model: z.string().optional(),
    usage: usageSchema.optional(),
  })
  .passthrough();

export class ClaudeCodeParser implements JsonlParser {
  public readonly agent = 'claude-code';

  public parseLine(line: string, sourceFile: string): ParseResult {
    if (line.trim().length === 0) {
      return { ok: false, reason: 'empty-line' };
    }

    const parsedJson = safeJson(line);
    if (!parsedJson.ok) {
      return { ok: false, reason: 'invalid-json' };
    }

    const parsed = claudeLineSchema.safeParse(parsedJson.value);
    if (!parsed.success) {
      return { ok: false, reason: 'unrecognized-shape' };
    }

    const usage = parsed.data.message?.usage ?? parsed.data.usage;
    const model = parsed.data.message?.model ?? parsed.data.model;
    if (!usage || !model) {
      return { ok: false, reason: 'no-usage' };
    }

    const occurredAt = normalizeTimestamp(parsed.data.timestamp ?? parsed.data.created_at);
    const upstreamId =
      parsed.data.uuid ??
      parsed.data.message?.id ??
      parsed.data.id ??
      `${path.basename(sourceFile)}:${occurredAt}:${model}`;
    const sessionId = parsed.data.sessionId ?? parsed.data.session_id ?? path.basename(path.dirname(sourceFile));

    const event = parsedUsageEventSchema.safeParse({
      agent: 'claude-code',
      upstreamId,
      sessionId,
      model,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheReadTokens: usage.cache_read_input_tokens,
      cacheWriteTokens: usage.cache_creation_input_tokens,
      occurredAt,
      projectSlug: projectSlugFromSource(sourceFile, parsed.data.cwd),
    });

    if (!event.success) {
      return { ok: false, reason: 'normalized-schema-failed' };
    }

    return { ok: true, event: event.data };
  }
}

