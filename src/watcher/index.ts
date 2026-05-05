import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
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
    this.watcher = watch(this.options.paths, {
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    });

    this.watcher.on('add', (filePath) => {
      if (isJsonlFile(filePath)) {
        void this.processFile(filePath);
      }
    });
    this.watcher.on('change', (filePath) => {
      if (isJsonlFile(filePath)) {
        void this.processFile(filePath);
      }
    });
    this.watcher.on('error', (error) => {
      this.options.logger.warn('watcher', 'Watcher error', {
        error: error instanceof Error ? error.message : String(error),
      });
    });

    void this.processExistingFiles();
  }

  public async stop(): Promise<void> {
    await this.watcher?.close();
  }

  public async scanNow(): Promise<void> {
    await this.processExistingFiles();
  }

  private async processFile(filePath: string): Promise<void> {
    try {
      const currentStat = await stat(filePath);
      const offsetKey = offsetKeyForFile(this.options.parser.agent, filePath);
      const previousOffset = await this.options.store.getOffset(offsetKey);
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

      await this.options.store.setOffset(offsetKey, currentStat.size);
    } catch (error) {
      this.options.logger.warn('watcher', 'Failed to process usage file', {
        fileName: path.basename(filePath),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async processExistingFiles(): Promise<void> {
    try {
      let fileCount = 0;
      for (const rootPath of this.options.paths) {
        const files = await listJsonlFiles(rootPath);
        fileCount += files.length;
        for (const filePath of files) {
          await this.processFile(filePath);
        }
      }

      this.options.logger.info('watcher', 'Initial usage-log scan completed', { fileCount });
    } catch (error) {
      this.options.logger.warn('watcher', 'Initial usage-log scan failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

const OFFSET_SCHEMA_VERSION = 2;

export function offsetKeyForFile(agent: string, filePath: string): string {
  return `${agent}:v${OFFSET_SCHEMA_VERSION}:${path.resolve(filePath)}`;
}

export function isJsonlFile(filePath: string): boolean {
  return path.extname(filePath).toLowerCase() === '.jsonl';
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

export async function listJsonlFiles(rootPath: string): Promise<string[]> {
  const rootStat = await statIfExists(rootPath);
  if (rootStat === undefined) {
    return [];
  }

  if (rootStat.isFile()) {
    return isJsonlFile(rootPath) ? [rootPath] : [];
  }

  if (!rootStat.isDirectory()) {
    return [];
  }

  const entries = await readdir(rootPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listJsonlFiles(entryPath)));
    } else if (entry.isFile() && isJsonlFile(entryPath)) {
      files.push(entryPath);
    }
  }

  return files;
}

async function statIfExists(filePath: string): Promise<Awaited<ReturnType<typeof stat>> | undefined> {
  try {
    return await stat(filePath);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}
