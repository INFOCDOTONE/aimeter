import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  defaultClaudeCodePaths,
  defaultCodexCliPaths,
  defaultGeminiCliPaths,
  resolveClaudeCodePaths,
  resolveCodexCliPaths,
  resolveGeminiCliPaths,
} from '../../../watcher/path-resolver.js';
import { isJsonlFile } from '../../../watcher/index.js';

describe('path resolver', () => {
  it('resolves the default Claude Code project directory', () => {
    expect(defaultClaudeCodePaths('/home/dev')).toEqual([path.join('/home/dev', '.claude', 'projects')]);
  });

  it('prefers explicit override paths', () => {
    expect(resolveClaudeCodePaths(['/tmp/claude'])).toEqual(['/tmp/claude']);
    expect(resolveCodexCliPaths(['/tmp/codex'])).toEqual(['/tmp/codex']);
    expect(resolveGeminiCliPaths(['/tmp/gemini'])).toEqual(['/tmp/gemini']);
  });

  it('resolves default Codex and Gemini session directories', () => {
    expect(defaultCodexCliPaths('/home/dev')).toEqual([path.join('/home/dev', '.codex', 'sessions')]);
    expect(defaultGeminiCliPaths('/home/dev')).toEqual([path.join('/home/dev', '.gemini', 'sessions')]);
  });

  it('accepts only JSONL files for ingestion', () => {
    expect(isJsonlFile(path.join('/home/dev', '.claude', 'projects', 'session.JSONL'))).toBe(true);
    expect(isJsonlFile(path.join('/home/dev', '.claude', 'projects', 'session.json'))).toBe(false);
    expect(isJsonlFile(path.join('/home/dev', '.claude', 'projects', 'notes.txt'))).toBe(false);
  });
});
