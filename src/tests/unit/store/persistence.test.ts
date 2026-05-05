import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ParsedUsageEvent } from '../../../parsers/types.js';
import { LocalEventStore } from '../../../store/persistence.js';

describe('LocalEventStore', () => {
  it('appends events once and dedupes by upstream id', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'aimeter-store-'));
    const store = new LocalEventStore(dir);
    await store.init();

    await store.appendParsedEvents([event('evt_1')]);
    await store.appendParsedEvents([event('evt_1')]);

    const events = await store.readAllEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.id).toMatch(/^[a-f0-9]{64}$/);

    const raw = await readFile(
      path.join(dir, 'infoc-one.aimeter', 'events', '2026-05.jsonl'),
      'utf8',
    );
    expect(raw.trim().split('\n')).toHaveLength(1);
  });

  it('tracks file offsets', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'aimeter-store-'));
    const store = new LocalEventStore(dir);
    await store.init();

    await store.setOffset('/tmp/session.jsonl', 42);
    await expect(store.getOffset('/tmp/session.jsonl')).resolves.toBe(42);
  });

  it('clears offsets with stored events so existing logs can be re-imported', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'aimeter-store-'));
    const store = new LocalEventStore(dir);
    await store.init();

    await store.appendParsedEvents([event('evt_clear')]);
    await store.setOffset('/tmp/session.jsonl', 42);

    await store.clear();

    await expect(store.readAllEvents()).resolves.toEqual([]);
    await expect(store.getOffset('/tmp/session.jsonl')).resolves.toBe(0);
  });

  it('applies pricing overrides when appending new events', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'aimeter-store-'));
    const store = new LocalEventStore(dir, {
      'claude-sonnet-4': {
        inputUsdPerMillion: 10,
        outputUsdPerMillion: 20,
        cacheReadUsdPerMillion: 1,
        cacheWriteUsdPerMillion: 2,
      },
    });
    await store.init();

    const appended = await store.appendParsedEvents([event('evt_override')]);

    expect(appended[0]?.pricingSnapshot.source).toBe('override');
    expect(appended[0]?.costConfidence).toBe('high');
  });

  it('excludes subscription-included events from today estimated cost summary', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'aimeter-store-'));
    const store = new LocalEventStore(dir);
    await store.init();

    await store.appendParsedEvents([event('evt_subscription')]);

    const summary = await store.readTodaySummary(new Date('2026-05-05T12:00:00.000Z'), {
      agentOverrides: { 'claude-code': 'subscription-included' },
      modelOverrides: {},
    });

    expect(summary.tokens).toBe(150);
    expect(summary.costUsdEstimated).toBe(0);
  });
});

function event(upstreamId: string): ParsedUsageEvent {
  return {
    agent: 'claude-code',
    upstreamId,
    sessionId: 'session',
    model: 'claude-sonnet-4-20250514',
    inputTokens: 100,
    outputTokens: 50,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    occurredAt: '2026-05-05T08:00:00.000Z',
    projectSlug: 'project',
  };
}
