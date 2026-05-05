import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CodexCliParser } from '../../../parsers/codex-cli.js';

const parser = new CodexCliParser();

describe('CodexCliParser', () => {
    it('normalizes top-level usage without leaking forbidden content fields', async () => {
        const line = await fixture('v1-basic.jsonl');
        const parsed = parser.parseLine(line, '/tmp/.codex/sessions/alpha/session.jsonl');

        expect(parsed.ok).toBe(true);
        if (!parsed.ok) {
            throw new Error(parsed.reason);
        }

        expect(parsed.event).toEqual({
            agent: 'codex-cli',
            upstreamId: 'codex_evt_001',
            sessionId: 'codex-session-alpha',
            model: 'gpt-5',
            inputTokens: 1420,
            outputTokens: 420,
            cacheReadTokens: 80,
            cacheWriteTokens: 0,
            occurredAt: '2026-05-05T09:00:00.000Z',
            projectSlug: 'alpha',
        });
        expect(JSON.stringify(parsed.event)).not.toContain('forbidden prompt text');
    });

    it('supports response wrapper usage fields', async () => {
        const line = await fixture('v1-response-wrapper.jsonl');
        const parsed = parser.parseLine(line, 'C:\\Users\\dev\\.codex\\sessions\\beta\\session.jsonl');

        expect(parsed.ok).toBe(true);
        if (!parsed.ok) {
            throw new Error(parsed.reason);
        }

        expect(parsed.event.upstreamId).toBe('resp_codex_002');
        expect(parsed.event.model).toBe('gpt-4.1');
        expect(parsed.event.inputTokens).toBe(860);
        expect(parsed.event.outputTokens).toBe(210);
        expect(parsed.event.cacheReadTokens).toBe(40);
        expect(parsed.event.projectSlug).toBe('beta');
    });

    it('treats missing cache counters as zero', async () => {
        const line = await fixture('v1-missing-cache.jsonl');
        const parsed = parser.parseLine(line, '/home/dev/.codex/sessions/gamma/session.jsonl');

        expect(parsed.ok).toBe(true);
        if (!parsed.ok) {
            throw new Error(parsed.reason);
        }

        expect(parsed.event.cacheReadTokens).toBe(0);
        expect(parsed.event.cacheWriteTokens).toBe(0);
    });

    it('supports Codex CLI envelope token_count events', async () => {
        const lines = (await fixture('v2-envelope-token-count.jsonl')).split('\n').filter(Boolean);
        const envelopeParser = new CodexCliParser();
        const sourceFile = '/home/dev/.codex/sessions/2026/05/05/session.jsonl';

        const metadata = envelopeParser.parseLine(lines[0] ?? '', sourceFile);
        const context = envelopeParser.parseLine(lines[1] ?? '', sourceFile);
        const parsed = envelopeParser.parseLine(lines[2] ?? '', sourceFile);

        expect(metadata).toEqual({ ok: false, reason: 'no-usage' });
        expect(context).toEqual({ ok: false, reason: 'no-usage' });
        expect(parsed.ok).toBe(true);
        if (!parsed.ok) {
            throw new Error(parsed.reason);
        }

        expect(parsed.event).toEqual({
            agent: 'codex-cli',
            upstreamId: 'token_count:codex-session-delta:gpt-5:27404:20864:235:33:27639',
            sessionId: 'codex-session-delta',
            model: 'gpt-5',
            inputTokens: 6540,
            outputTokens: 235,
            cacheReadTokens: 20864,
            cacheWriteTokens: 0,
            occurredAt: '2026-05-05T12:00:01.000Z',
            projectSlug: 'delta',
        });
        expect(JSON.stringify(parsed.event)).not.toContain('forbidden prompt text');
    });

    it('deduplicates repeated envelope token_count snapshots by cumulative total', async () => {
        const lines = (await fixture('v2-envelope-token-count.jsonl')).split('\n').filter(Boolean);
        const envelopeParser = new CodexCliParser();
        const sourceFile = '/home/dev/.codex/sessions/2026/05/05/session.jsonl';

        envelopeParser.parseLine(lines[0] ?? '', sourceFile);
        envelopeParser.parseLine(lines[1] ?? '', sourceFile);
        const first = envelopeParser.parseLine(lines[2] ?? '', sourceFile);
        const duplicate = envelopeParser.parseLine(
            '{"type":"event_msg","timestamp":"2026-05-05T12:05:01.000Z","payload":{"type":"token_count","info":{"last_token_usage":{"input_tokens":27404,"cached_input_tokens":20864,"output_tokens":235,"reasoning_output_tokens":33,"total_tokens":27639},"total_token_usage":{"input_tokens":27404,"cached_input_tokens":20864,"output_tokens":235,"reasoning_output_tokens":33,"total_tokens":27639}}}}',
            sourceFile,
        );

        expect(first.ok).toBe(true);
        expect(duplicate.ok).toBe(true);
        if (!first.ok || !duplicate.ok) {
            throw new Error('Expected both token_count events to parse.');
        }
        expect(duplicate.event.upstreamId).toBe(first.event.upstreamId);
    });

    it('skips lines without usage', () => {
        const parsed = parser.parseLine('{"message":{"content":"secret"}}', '/tmp/a.jsonl');
        expect(parsed).toEqual({ ok: false, reason: 'no-usage' });
    });
});

async function fixture(name: string): Promise<string> {
    return readFile(path.join(process.cwd(), 'fixtures', 'codex-cli', name), 'utf8');
}