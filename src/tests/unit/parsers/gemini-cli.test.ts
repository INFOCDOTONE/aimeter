import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GeminiCliParser } from '../../../parsers/gemini-cli.js';

const parser = new GeminiCliParser();

describe('GeminiCliParser', () => {
    it('normalizes usage metadata without leaking forbidden content fields', async () => {
        const line = await fixture('v1-basic.jsonl');
        const parsed = parser.parseLine(line, '/tmp/.gemini/sessions/alpha/session.jsonl');

        expect(parsed.ok).toBe(true);
        if (!parsed.ok) {
            throw new Error(parsed.reason);
        }

        expect(parsed.event).toEqual({
            agent: 'gemini-cli',
            upstreamId: 'gemini_evt_001',
            sessionId: 'gemini-session-alpha',
            model: 'gemini-2.5-pro',
            inputTokens: 1300,
            outputTokens: 360,
            cacheReadTokens: 70,
            cacheWriteTokens: 0,
            occurredAt: '2026-05-05T11:00:00.000Z',
            projectSlug: 'alpha',
        });
        expect(JSON.stringify(parsed.event)).not.toContain('forbidden completion text');
    });

    it('supports response wrapper usage metadata', async () => {
        const line = await fixture('v1-response-wrapper.jsonl');
        const parsed = parser.parseLine(line, 'C:\\Users\\dev\\.gemini\\sessions\\beta\\session.jsonl');

        expect(parsed.ok).toBe(true);
        if (!parsed.ok) {
            throw new Error(parsed.reason);
        }

        expect(parsed.event.upstreamId).toBe('gemini_evt_002');
        expect(parsed.event.model).toBe('gemini-2.5-flash');
        expect(parsed.event.inputTokens).toBe(500);
        expect(parsed.event.outputTokens).toBe(120);
        expect(parsed.event.cacheReadTokens).toBe(25);
        expect(parsed.event.projectSlug).toBe('beta');
    });

    it('treats missing cache counters as zero', async () => {
        const line = await fixture('v1-missing-cache.jsonl');
        const parsed = parser.parseLine(line, '/home/dev/.gemini/sessions/gamma/session.jsonl');

        expect(parsed.ok).toBe(true);
        if (!parsed.ok) {
            throw new Error(parsed.reason);
        }

        expect(parsed.event.cacheReadTokens).toBe(0);
        expect(parsed.event.cacheWriteTokens).toBe(0);
    });

    it('skips lines without usage', () => {
        const parsed = parser.parseLine('{"prompt":"secret"}', '/tmp/a.jsonl');
        expect(parsed).toEqual({ ok: false, reason: 'no-usage' });
    });
});

async function fixture(name: string): Promise<string> {
    return readFile(path.join(process.cwd(), 'fixtures', 'gemini-cli', name), 'utf8');
}