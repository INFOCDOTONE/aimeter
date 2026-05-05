import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { JsonlParser } from '../../../parsers/base.js';
import { ClaudeCodeParser } from '../../../parsers/claude-code.js';
import { CodexCliParser } from '../../../parsers/codex-cli.js';
import { GeminiCliParser } from '../../../parsers/gemini-cli.js';

const FORBIDDEN_KEYS = ['prompt', 'completion', 'content', 'message', 'messages', 'input', 'output', 'request', 'response'];
const PARSERS: Array<{ parser: JsonlParser; fixtureDir: string; fixtures: string[] }> = [
    {
        parser: new ClaudeCodeParser(),
        fixtureDir: 'claude-code',
        fixtures: ['v1-basic.jsonl', 'v1-direct-usage.jsonl', 'v1-missing-cache.jsonl'],
    },
    {
        parser: new CodexCliParser(),
        fixtureDir: 'codex-cli',
        fixtures: ['v1-basic.jsonl', 'v1-response-wrapper.jsonl', 'v1-missing-cache.jsonl'],
    },
    {
        parser: new GeminiCliParser(),
        fixtureDir: 'gemini-cli',
        fixtures: ['v1-basic.jsonl', 'v1-response-wrapper.jsonl', 'v1-missing-cache.jsonl'],
    },
];

describe('parser forbidden-field policy', () => {
    for (const config of PARSERS) {
        for (const fixtureName of config.fixtures) {
            it(`${config.parser.agent} does not emit forbidden fields for ${fixtureName}`, async () => {
                const line = await readFile(path.join(process.cwd(), 'fixtures', config.fixtureDir, fixtureName), 'utf8');
                const parsed = config.parser.parseLine(line, `/tmp/${config.fixtureDir}/${fixtureName}`);

                expect(parsed.ok).toBe(true);
                if (!parsed.ok) {
                    throw new Error(parsed.reason);
                }

                expect(Object.keys(parsed.event)).not.toEqual(expect.arrayContaining(FORBIDDEN_KEYS));
                expect(JSON.stringify(parsed.event)).not.toContain('forbidden prompt text');
                expect(JSON.stringify(parsed.event)).not.toContain('forbidden completion text');
            });
        }
    }
});