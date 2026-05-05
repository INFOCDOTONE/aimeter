import os from 'node:os';
import path from 'node:path';

export function defaultClaudeCodePaths(homeDir = os.homedir()): string[] {
  return [path.join(homeDir, '.claude', 'projects')];
}

export function resolveClaudeCodePaths(overrides: string[]): string[] {
  return overrides.length > 0 ? overrides : defaultClaudeCodePaths();
}
