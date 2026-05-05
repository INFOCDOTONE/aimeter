import { appendFile, mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { ensureDir, readJsonFile, writeJsonFileAtomic } from '../lib/fs.js';
import { createEventId, createInstallId } from '../lib/id.js';
import { monthKey, startOfLocalDay } from '../lib/time.js';
import type { ParsedUsageEvent } from '../parsers/types.js';
import { estimateCost } from '../pricing/compute.js';
import { migrateMeta } from './migrations.js';
import {
  metaSchema,
  offsetMapSchema,
  storedEventSchema,
  type OffsetMap,
  type StoreMeta,
  type StoredEvent,
} from './schema.js';

export class LocalEventStore {
  private readonly rootPath: string;
  private readonly eventsPath: string;
  private readonly metaPath: string;
  private readonly offsetsPath: string;
  private readonly ids = new Set<string>();

  public constructor(globalStoragePath: string) {
    this.rootPath = path.join(globalStoragePath, 'infoc-one.aimeter');
    this.eventsPath = path.join(this.rootPath, 'events');
    this.metaPath = path.join(this.rootPath, 'meta.json');
    this.offsetsPath = path.join(this.rootPath, 'offsets.json');
  }

  public async init(): Promise<void> {
    await ensureDir(this.eventsPath);
    await this.ensureMeta();
    await this.loadIds();
  }

  public async appendParsedEvents(events: ParsedUsageEvent[]): Promise<StoredEvent[]> {
    const appended: StoredEvent[] = [];

    for (const event of events) {
      const stored = this.toStoredEvent(event);
      if (this.ids.has(stored.id)) {
        continue;
      }

      const filePath = path.join(this.eventsPath, `${monthKey(stored.occurredAt)}.jsonl`);
      await mkdir(path.dirname(filePath), { recursive: true });
      await appendFile(filePath, `${JSON.stringify(storedEventSchema.parse(stored))}\n`, {
        encoding: 'utf8',
        flag: 'a',
      });
      this.ids.add(stored.id);
      appended.push(stored);
    }

    return appended;
  }

  public async readAllEvents(): Promise<StoredEvent[]> {
    await ensureDir(this.eventsPath);
    const files = await readdir(this.eventsPath);
    const events: StoredEvent[] = [];

    for (const file of files.filter((entry) => entry.endsWith('.jsonl')).sort()) {
      const content = await readFile(path.join(this.eventsPath, file), 'utf8');
      for (const line of content.split('\n')) {
        if (line.trim().length === 0) {
          continue;
        }
        events.push(storedEventSchema.parse(JSON.parse(line)));
      }
    }

    return events;
  }

  public async readEventsBetween(from: Date, to: Date): Promise<StoredEvent[]> {
    const fromTime = from.getTime();
    const toTime = to.getTime();
    const events = await this.readAllEvents();
    return events.filter((event) => {
      const occurredAt = new Date(event.occurredAt).getTime();
      return occurredAt >= fromTime && occurredAt < toTime;
    });
  }

  public async readTodaySummary(now = new Date()): Promise<{ tokens: number; costUsdEstimated: number }> {
    const start = startOfLocalDay(now);
    const events = await this.readAllEvents();
    return events
      .filter((event) => new Date(event.occurredAt).getTime() >= start.getTime())
      .reduce(
        (summary, event) => ({
          tokens:
            summary.tokens +
            event.inputTokens +
            event.outputTokens +
            event.cacheReadTokens +
            event.cacheWriteTokens,
          costUsdEstimated: summary.costUsdEstimated + event.costUsdEstimated,
        }),
        { tokens: 0, costUsdEstimated: 0 },
      );
  }

  public async getOffset(filePath: string): Promise<number> {
    const offsets = await this.readOffsets();
    return offsets[filePath] ?? 0;
  }

  public async setOffset(filePath: string, offset: number): Promise<void> {
    const offsets = await this.readOffsets();
    offsets[filePath] = offset;
    await writeJsonFileAtomic(this.offsetsPath, offsetMapSchema.parse(offsets));
  }

  public async clear(): Promise<void> {
    await rm(this.eventsPath, { recursive: true, force: true });
    await ensureDir(this.eventsPath);
    this.ids.clear();
  }

  private async ensureMeta(): Promise<StoreMeta> {
    const fallback: StoreMeta = {
      schemaVersion: 1,
      installId: createInstallId(),
      createdAt: new Date().toISOString(),
    };
    const raw = await readJsonFile(this.metaPath, fallback);
    const meta = migrateMeta(metaSchema.parse(raw));
    await writeJsonFileAtomic(this.metaPath, meta);
    return meta;
  }

  private async loadIds(): Promise<void> {
    this.ids.clear();
    const events = await this.readAllEvents();
    for (const event of events) {
      this.ids.add(event.id);
    }
  }

  private async readOffsets(): Promise<OffsetMap> {
    const raw = await readJsonFile(this.offsetsPath, {});
    return offsetMapSchema.parse(raw);
  }

  private toStoredEvent(event: ParsedUsageEvent): StoredEvent {
    const estimated = estimateCost(event);
    return storedEventSchema.parse({
      id: createEventId(event.agent, event.upstreamId),
      agent: event.agent,
      model: event.model,
      inputTokens: event.inputTokens,
      outputTokens: event.outputTokens,
      cacheReadTokens: event.cacheReadTokens,
      cacheWriteTokens: event.cacheWriteTokens,
      costUsdEstimated: estimated.costUsdEstimated,
      costConfidence: estimated.costConfidence,
      pricingSnapshot: estimated.pricingSnapshot,
      sessionId: event.sessionId,
      projectSlug: event.projectSlug,
      occurredAt: event.occurredAt,
      recordedAt: new Date().toISOString(),
      schemaVersion: 1,
    });
  }
}

export async function fileSize(filePath: string): Promise<number> {
  try {
    return (await stat(filePath)).size;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return 0;
    }
    throw error;
  }
}
