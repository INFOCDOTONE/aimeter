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
            inputTokens: 1500,
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
        expect(parsed.event.inputTokens).toBe(900);
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

    it('skips lines without usage', () => {
        const parsed = parser.parseLine('{"message":{"content":"secret"}}', '/tmp/a.jsonl');
        expect(parsed).toEqual({ ok: false, reason: 'no-usage' });
    });
});

async function fixture(name: string): Promise<string> {
    return readFile(path.join(process.cwd(), 'fixtures', 'codex-cli', name), 'utf8');
}