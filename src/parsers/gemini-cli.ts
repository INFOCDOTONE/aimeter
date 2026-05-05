import path from 'node:path';
import { z } from 'zod';
import type { JsonlParser } from './base.js';
import { normalizeTimestamp, projectSlugFromSource, safeJson } from './helpers.js';
import { parsedUsageEventSchema, type ParseResult } from './types.js';

const usageMetadataSchema = z
    .object({
        promptTokenCount: z.number().int().nonnegative().optional().default(0),
        candidatesTokenCount: z.number().int().nonnegative().optional().default(0),
        cachedContentTokenCount: z.number().int().nonnegative().optional().default(0),
    })
    .passthrough();

const geminiLineSchema = z
    .object({
        id: z.string().optional(),
        responseId: z.string().optional(),
        sessionId: z.string().optional(),
        session_id: z.string().optional(),
        timestamp: z.string().optional(),
        created_at: z.string().optional(),
        cwd: z.string().optional(),
        model: z.string().optional(),
        usageMetadata: usageMetadataSchema.optional(),
        response: z
            .object({
                responseId: z.string().optional(),
                modelVersion: z.string().optional(),
                model: z.string().optional(),
                usageMetadata: usageMetadataSchema.optional(),
            })
            .passthrough()
            .optional(),
    })
    .passthrough();

export class GeminiCliParser implements JsonlParser {
    public readonly agent = 'gemini-cli';

    public parseLine(line: string, sourceFile: string): ParseResult {
        if (line.trim().length === 0) {
            return { ok: false, reason: 'empty-line' };
        }

        const parsedJson = safeJson(line);
        if (!parsedJson.ok) {
            return { ok: false, reason: 'invalid-json' };
        }

        const parsed = geminiLineSchema.safeParse(parsedJson.value);
        if (!parsed.success) {
            return { ok: false, reason: 'unrecognized-shape' };
        }

        const usage = parsed.data.response?.usageMetadata ?? parsed.data.usageMetadata;
        const model = parsed.data.response?.modelVersion ?? parsed.data.response?.model ?? parsed.data.model;
        if (!usage || !model) {
            return { ok: false, reason: 'no-usage' };
        }

        const occurredAt = normalizeTimestamp(parsed.data.timestamp ?? parsed.data.created_at);
        const upstreamId =
            parsed.data.response?.responseId ??
            parsed.data.responseId ??
            parsed.data.id ??
            `${path.basename(sourceFile)}:${occurredAt}:${model}`;
        const sessionId = parsed.data.sessionId ?? parsed.data.session_id ?? path.basename(path.dirname(sourceFile));

        const event = parsedUsageEventSchema.safeParse({
            agent: 'gemini-cli',
            upstreamId,
            sessionId,
            model,
            inputTokens: usage.promptTokenCount,
            outputTokens: usage.candidatesTokenCount,
            cacheReadTokens: usage.cachedContentTokenCount,
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