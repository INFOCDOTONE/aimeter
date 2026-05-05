import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { listJsonlFiles, offsetKeyForFile } from '../../../watcher/index.js';

describe('listJsonlFiles', () => {
  it('recursively finds JSONL files from a watched root', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'aimeter-watcher-'));
    const nested = path.join(dir, 'project', 'session');
    await mkdir(nested, { recursive: true });
    const rootFile = path.join(dir, 'root.jsonl');
    const nestedFile = path.join(nested, 'usage.JSONL');
    await writeFile(rootFile, '{}\n', 'utf8');
    await writeFile(nestedFile, '{}\n', 'utf8');
    await writeFile(path.join(nested, 'usage.json'), '{}\n', 'utf8');

    await expect(listJsonlFiles(dir)).resolves.toEqual(expect.arrayContaining([rootFile, nestedFile]));
  });

  it('returns an empty list for missing roots', async () => {
    const dir = path.join(os.tmpdir(), 'aimeter-missing-jsonl-root');

    await expect(listJsonlFiles(dir)).resolves.toEqual([]);
  });

  it('keys offsets by parser version and agent so parser fixes can backfill safely', () => {
    const filePath = path.join('/home/dev', '.codex', 'sessions', 'session.jsonl');

    expect(offsetKeyForFile('codex-cli', filePath)).toContain('codex-cli:v2:');
    expect(offsetKeyForFile('codex-cli', filePath)).not.toBe(filePath);
  });
});
