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

const codexTokenUsageSchema = z
    .object({
        input_tokens: z.number().int().nonnegative().optional(),
        cached_input_tokens: z.number().int().nonnegative().optional(),
        output_tokens: z.number().int().nonnegative().optional(),
        reasoning_output_tokens: z.number().int().nonnegative().optional(),
        total_tokens: z.number().int().nonnegative().optional(),
    })
    .passthrough();

const codexEnvelopeLineSchema = z
    .object({
        type: z.string().optional(),
        timestamp: z.string().optional(),
        payload: z
            .object({
                id: z.string().optional(),
                type: z.string().optional(),
                timestamp: z.union([z.string(), z.number()]).optional(),
                cwd: z.string().optional(),
                model: z.string().optional(),
                info: z
                    .object({
                        last_token_usage: codexTokenUsageSchema.optional(),
                        total_token_usage: codexTokenUsageSchema.optional(),
                    })
                    .passthrough()
                    .optional(),
            })
            .passthrough()
            .optional(),
    })
    .passthrough();

type CodexFileContext = {
    cwd: string | undefined;
    model: string | undefined;
    sessionId: string | undefined;
};

export class CodexCliParser implements JsonlParser {
    public readonly agent = 'codex-cli';

    private readonly contexts = new Map<string, CodexFileContext>();

    public parseLine(line: string, sourceFile: string): ParseResult {
        if (line.trim().length === 0) {
            return { ok: false, reason: 'empty-line' };
        }

        const parsedJson = safeJson(line);
        if (!parsedJson.ok) {
            return { ok: false, reason: 'invalid-json' };
        }

        const envelopeParsed = codexEnvelopeLineSchema.safeParse(parsedJson.value);
        if (envelopeParsed.success && envelopeParsed.data.payload !== undefined) {
            return this.parseEnvelopeLine(envelopeParsed.data, sourceFile);
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

        const cacheReadTokens = usage.cached_tokens ?? usage.input_tokens_details?.cached_tokens ?? 0;
        const inputTokenTotal = usage.prompt_tokens ?? usage.input_tokens ?? 0;

        const event = parsedUsageEventSchema.safeParse({
            agent: 'codex-cli',
            upstreamId,
            sessionId,
            model,
            inputTokens: subtractCachedInput(inputTokenTotal, cacheReadTokens),
            outputTokens: usage.completion_tokens ?? usage.output_tokens ?? 0,
            cacheReadTokens,
            cacheWriteTokens: 0,
            occurredAt,
            projectSlug: projectSlugFromSource(sourceFile, parsed.data.cwd),
        });

        if (!event.success) {
            return { ok: false, reason: 'normalized-schema-failed' };
        }

        return { ok: true, event: event.data };
    }

    private parseEnvelopeLine(line: z.infer<typeof codexEnvelopeLineSchema>, sourceFile: string): ParseResult {
        const payload = line.payload;
        if (payload === undefined) {
            return { ok: false, reason: 'unrecognized-shape' };
        }

        const context = this.contextFor(sourceFile);
        if (line.type === 'session_meta' || payload.id !== undefined || payload.cwd !== undefined) {
            context.sessionId = payload.id ?? context.sessionId;
            context.cwd = payload.cwd ?? context.cwd;
        }
        if (payload.model !== undefined) {
            context.model = payload.model;
        }

        const usage = payload.info?.last_token_usage;
        if (line.type !== 'event_msg' || payload.type !== 'token_count' || usage === undefined) {
            return { ok: false, reason: 'no-usage' };
        }

        const model = context.model;
        if (model === undefined) {
            return { ok: false, reason: 'no-model-context' };
        }

        const totalUsage = payload.info?.total_token_usage;
        const sessionId = context.sessionId ?? path.basename(sourceFile, path.extname(sourceFile));
        const cacheReadTokens = usage.cached_input_tokens ?? 0;
        const inputTokenTotal = usage.input_tokens ?? 0;
        const occurredAt = normalizeTimestamp(line.timestamp ?? payload.timestamp);

        const event = parsedUsageEventSchema.safeParse({
            agent: 'codex-cli',
            upstreamId: tokenCountUpstreamId(sessionId, model, occurredAt, usage, totalUsage),
            sessionId,
            model,
            inputTokens: subtractCachedInput(inputTokenTotal, cacheReadTokens),
            outputTokens: usage.output_tokens ?? 0,
            cacheReadTokens,
            cacheWriteTokens: 0,
            occurredAt,
            projectSlug: projectSlugFromSource(sourceFile, context.cwd),
        });

        if (!event.success) {
            return { ok: false, reason: 'normalized-schema-failed' };
        }

        return { ok: true, event: event.data };
    }

    private contextFor(sourceFile: string): CodexFileContext {
        const existing = this.contexts.get(sourceFile);
        if (existing !== undefined) {
            return existing;
        }
        const created: CodexFileContext = { cwd: undefined, model: undefined, sessionId: undefined };
        this.contexts.set(sourceFile, created);
        return created;
    }
}

function subtractCachedInput(inputTokenTotal: number, cacheReadTokens: number): number {
    return Math.max(0, inputTokenTotal - cacheReadTokens);
}

function tokenCountUpstreamId(
    sessionId: string,
    model: string,
    occurredAt: string,
    usage: z.infer<typeof codexTokenUsageSchema>,
    totalUsage: z.infer<typeof codexTokenUsageSchema> | undefined,
): string {
    const stableUsage = totalUsage ?? usage;
    const stableCounters = [
        stableUsage.input_tokens ?? 0,
        stableUsage.cached_input_tokens ?? 0,
        stableUsage.output_tokens ?? 0,
        stableUsage.reasoning_output_tokens ?? 0,
        stableUsage.total_tokens ?? 0,
    ].join(':');
    const fallbackSuffix = totalUsage === undefined ? `:${occurredAt}` : '';
    return `token_count:${sessionId}:${model}:${stableCounters}${fallbackSuffix}`;
}
