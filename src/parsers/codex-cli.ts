import path from 'node:path';
import { z } from 'zod';
import type { JsonlParser } from './base.js';
import { normalizeTimestamp, projectSlugFromSource, safeJson } from './helpers.js';
import { parsedUsageEventSchema, type ParseResult } from './types.js';

const usageSchema = z
    .object({
        prompt_tokens: z.number().int().nonnegative().optional(),
        completion_tokens: z.number().int().nonnegative().optional(),
        cached_tokens: z.number().int().nonnegative().optional(),
        input_tokens: z.number().int().nonnegative().optional(),
        output_tokens: z.number().int().nonnegative().optional(),
        input_tokens_details: z
            .object({
                cached_tokens: z.number().int().nonnegative().optional(),
            })
            .passthrough()
            .optional(),
    })
    .passthrough();

const codexLineSchema = z
    .object({
        id: z.string().optional(),
        response_id: z.string().optional(),
        session_id: z.string().optional(),
        conversation_id: z.string().optional(),
        timestamp: z.string().optional(),
        created_at: z.union([z.string(), z.number()]).optional(),
        cwd: z.string().optional(),
        model: z.string().optional(),
        usage: usageSchema.optional(),
        response: z
            .object({
                id: z.string().optional(),
                model: z.string().optional(),
                created_at: z.union([z.string(), z.number()]).optional(),
                usage: usageSchema.optional(),
            })
            .passthrough()
            .optional(),
    })
    .passthrough();

export class CodexCliParser implements JsonlParser {
    public readonly agent = 'codex-cli';

    public parseLine(line: string, sourceFile: string): ParseResult {
        if (line.trim().length === 0) {
            return { ok: false, reason: 'empty-line' };
        }

        const parsedJson = safeJson(line);
        if (!parsedJson.ok) {
            return { ok: false, reason: 'invalid-json' };
        }

        const parsed = codexLineSchema.safeParse(parsedJson.value);
        if (!parsed.success) {
            return { ok: false, reason: 'unrecognized-shape' };
        }

        const usage = parsed.data.response?.usage ?? parsed.data.usage;
        const model = parsed.data.response?.model ?? parsed.data.model;
        if (!usage || !model) {
            return { ok: false, reason: 'no-usage' };
        }

        const occurredAt = normalizeTimestamp(
            parsed.data.timestamp ?? parsed.data.response?.created_at ?? parsed.data.created_at,
        );
        const upstreamId =
            parsed.data.response?.id ??
            parsed.data.response_id ??
            parsed.data.id ??
            `${path.basename(sourceFile)}:${occurredAt}:${model}`;
        const sessionId = parsed.data.session_id ?? parsed.data.conversation_id ?? path.basename(path.dirname(sourceFile));

        const event = parsedUsageEventSchema.safeParse({
            agent: 'codex-cli',
            upstreamId,
            sessionId,
            model,
            inputTokens: usage.prompt_tokens ?? usage.input_tokens ?? 0,
            outputTokens: usage.completion_tokens ?? usage.output_tokens ?? 0,
            cacheReadTokens: usage.cached_tokens ?? usage.input_tokens_details?.cached_tokens ?? 0,
            cacheWriteTokens: 0,
            occurredAt,
            projectSlug: projectSlugFromSource(sourceFile, parsed.data.cwd),
        });

        if (!event.success) {
            return { ok: false, reason: 'normalized-schema-failed' };
        }

        return { ok: true, event: event.data };
    }
}