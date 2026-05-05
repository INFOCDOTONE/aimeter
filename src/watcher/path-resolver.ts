import os from 'node:os';
import path from 'node:path';

export function defaultClaudeCodePaths(homeDir = os.homedir()): string[] {
  return [path.join(homeDir, '.claude', 'projects')];
}

export function defaultCodexCliPaths(homeDir = os.homedir()): string[] {
  return [path.join(homeDir, '.codex', 'sessions')];
}

// [NEEDS-INPUT: Confirm Gemini CLI's canonical local JSONL session-log directory after testing against a live install.]
export function defaultGeminiCliPaths(homeDir = os.homedir()): string[] {
  return [path.join(homeDir, '.gemini', 'sessions')];
}

export function resolveClaudeCodePaths(overrides: string[]): string[] {
  return overrides.length > 0 ? overrides : defaultClaudeCodePaths();
}

export function resolveCodexCliPaths(overrides: string[]): string[] {
  return overrides.length > 0 ? overrides : defaultCodexCliPaths();
}

export function resolveGeminiCliPaths(overrides: string[]): string[] {
  return overrides.length > 0 ? overrides : defaultGeminiCliPaths();
}
