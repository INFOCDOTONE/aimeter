import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ClaudeCodeParser } from '../../../parsers/claude-code.js';

const parser = new ClaudeCodeParser();

describe('ClaudeCodeParser', () => {
  it('normalizes message usage without leaking forbidden content fields', async () => {
    const line = await fixture('v1-basic.jsonl');
    const parsed = parser.parseLine(line, '/tmp/.claude/projects/alpha/session.jsonl');

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      throw new Error(parsed.reason);
    }

    expect(parsed.event).toEqual({
      agent: 'claude-code',
      upstreamId: 'evt_001',
      sessionId: 'session-alpha',
      model: 'claude-sonnet-4-20250514',
      inputTokens: 1200,
      outputTokens: 340,
      cacheReadTokens: 50,
      cacheWriteTokens: 20,
      occurredAt: '2026-05-05T08:00:00.000Z',
      projectSlug: 'alpha',
    });
    expect(JSON.stringify(parsed.event)).not.toContain('forbidden prompt text');
  });

  it('supports direct top-level usage fields', async () => {
    const line = await fixture('v1-direct-usage.jsonl');
    const parsed = parser.parseLine(line, 'C:\\Users\\dev\\.claude\\projects\\beta\\session.jsonl');

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      throw new Error(parsed.reason);
    }

    expect(parsed.event.inputTokens).toBe(800);
    expect(parsed.event.outputTokens).toBe(200);
    expect(parsed.event.cacheReadTokens).toBe(0);
    expect(parsed.event.cacheWriteTokens).toBe(0);
    expect(parsed.event.projectSlug).toBe('beta');
  });

  it('treats missing cache counters as zero', async () => {
    const line = await fixture('v1-missing-cache.jsonl');
    const parsed = parser.parseLine(line, '/home/dev/.claude/projects/gamma/session.jsonl');

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      throw new Error(parsed.reason);
    }

    expect(parsed.event.cacheReadTokens).toBe(0);
    expect(parsed.event.cacheWriteTokens).toBe(0);
    expect(JSON.stringify(parsed.event)).not.toContain('forbidden completion text');
  });

  it('skips lines without usage', () => {
    const parsed = parser.parseLine('{"type":"user","message":{"content":"secret"}}', '/tmp/a.jsonl');
    expect(parsed).toEqual({ ok: false, reason: 'no-usage' });
  });
});

async function fixture(name: string): Promise<string> {
  return readFile(path.join(process.cwd(), 'fixtures', 'claude-code', name), 'utf8');
}
