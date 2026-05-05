import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { defaultClaudeCodePaths, resolveClaudeCodePaths } from '../../../watcher/path-resolver.js';

describe('path resolver', () => {
  it('resolves the default Claude Code project directory', () => {
    expect(defaultClaudeCodePaths('/home/dev')).toEqual([path.join('/home/dev', '.claude', 'projects')]);
  });

  it('prefers explicit override paths', () => {
    expect(resolveClaudeCodePaths(['/tmp/claude'])).toEqual(['/tmp/claude']);
  });
});
