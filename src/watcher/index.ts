import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { watch, type FSWatcher } from 'chokidar';
import type { Logger } from '../lib/logger.js';
import type { JsonlParser } from '../parsers/base.js';
import type { ParsedUsageEvent } from '../parsers/types.js';
import type { LocalEventStore } from '../store/persistence.js';

export type UsageWatcherOptions = {
  paths: string[];
  parser: JsonlParser;
  store: LocalEventStore;
  logger: Logger;
  onEvents: (events: ParsedUsageEvent[]) => Promise<void>;
};

export class UsageWatcher {
  private readonly options: UsageWatcherOptions;
  private watcher: FSWatcher | undefined;

  public constructor(options: UsageWatcherOptions) {
    this.options = options;
  }

  public start(): void {
    const patterns = this.options.paths.map((rootPath) => path.join(rootPath, '**', '*.jsonl'));
    this.watcher = watch(patterns, {
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    });

    this.watcher.on('add', (filePath) => {
      void this.processFile(filePath);
    });
    this.watcher.on('change', (filePath) => {
      void this.processFile(filePath);
    });
    this.watcher.on('error', (error) => {
      this.options.logger.warn('watcher', 'Watcher error', {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  public async stop(): Promise<void> {
    await this.watcher?.close();
  }

  private async processFile(filePath: string): Promise<void> {
    try {
      const currentStat = await stat(filePath);
      const previousOffset = await this.options.store.getOffset(filePath);
      const start = previousOffset > currentStat.size ? 0 : previousOffset;
      const lines = await readNewLines(filePath, start);
      const events: ParsedUsageEvent[] = [];

      for (const line of lines) {
        const parsed = this.options.parser.parseLine(line, filePath);
        if (parsed.ok) {
          events.push(parsed.event);
        } else {
          this.options.logger.debug('watcher', 'Skipped JSONL line', { reason: parsed.reason });
        }
      }

      if (events.length > 0) {
        await this.options.onEvents(events);
      }

      await this.options.store.setOffset(filePath, currentStat.size);
    } catch (error) {
      this.options.logger.warn('watcher', 'Failed to process usage file', {
        fileName: path.basename(filePath),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

async function readNewLines(filePath: string, start: number): Promise<string[]> {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(filePath, { encoding: 'utf8', start });
    stream.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk));
    });
    stream.on('error', reject);
    stream.on('end', resolve);
  });

  return Buffer.concat(chunks)
    .toString('utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0);
}
