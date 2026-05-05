import { access, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { Logger } from '../lib/logger.js';
import type { JsonlParser } from '../parsers/base.js';
import { ClaudeCodeParser } from '../parsers/claude-code.js';
import { CodexCliParser } from '../parsers/codex-cli.js';
import { GeminiCliParser } from '../parsers/gemini-cli.js';
import { DEFAULT_CATALOG } from '../pricing/catalog.js';
import { readSettings } from '../settings/index.js';
import type { LocalEventStore } from '../store/persistence.js';
import {
    resolveClaudeCodePaths,
    resolveCodexCliPaths,
    resolveGeminiCliPaths,
} from '../watcher/path-resolver.js';

export type DoctorSeverity = 'ok' | 'warn' | 'error';

export type DoctorCheck = {
    name: string;
    severity: DoctorSeverity;
    message: string;
};

export type DoctorResult = {
    generatedAt: string;
    checks: DoctorCheck[];
};

type ParserConfig = {
    name: string;
    enabled: boolean;
    paths: string[];
    parser: JsonlParser;
};

export async function runDoctor(options: {
    logger: Logger;
    store: LocalEventStore;
}): Promise<DoctorResult> {
    const settings = readSettings();
    const checks: DoctorCheck[] = [];

    checks.push({
        name: 'Refresh interval',
        severity: 'ok',
        message: `${settings.refreshIntervalSec}s configured.`,
    });
    checks.push({
        name: 'Pricing catalog',
        severity: catalogIsFresh() ? 'ok' : 'warn',
        message: catalogIsFresh()
            ? 'Bundled catalog entries are within the freshness window.'
            : 'Bundled catalog entries are older than 30 days; run pricing refresh before publish.',
    });

    await checkStorage(options.store, checks);

    const parserConfigs: ParserConfig[] = [
        {
            name: 'Claude Code',
            enabled: settings.parsers.claudeCode.enabled,
            paths: resolveClaudeCodePaths(settings.parsers.claudeCode.paths),
            parser: new ClaudeCodeParser(),
        },
        {
            name: 'Codex CLI',
            enabled: settings.parsers.codexCli.enabled,
            paths: resolveCodexCliPaths(settings.parsers.codexCli.paths),
            parser: new CodexCliParser(),
        },
        {
            name: 'Gemini CLI',
            enabled: settings.parsers.geminiCli.enabled,
            paths: resolveGeminiCliPaths(settings.parsers.geminiCli.paths),
            parser: new GeminiCliParser(),
        },
    ];

    for (const config of parserConfigs) {
        await checkParser(config, checks);
    }

    options.logger.info('doctor', 'AIMeter doctor completed', {
        checks: checks.length,
        errors: checks.filter((check) => check.severity === 'error').length,
        warnings: checks.filter((check) => check.severity === 'warn').length,
    });

    return { generatedAt: new Date().toISOString(), checks };
}

async function checkStorage(store: LocalEventStore, checks: DoctorCheck[]): Promise<void> {
    try {
        await store.readAllEvents();
        checks.push({ name: 'Local store', severity: 'ok', message: 'Append-only event store is readable.' });
    } catch (error) {
        checks.push({
            name: 'Local store',
            severity: 'error',
            message: `Could not read the local event store: ${errorMessage(error)}`,
        });
    }
}

async function checkParser(config: ParserConfig, checks: DoctorCheck[]): Promise<void> {
    if (!config.enabled) {
        checks.push({ name: config.name, severity: 'warn', message: 'Parser is disabled in AIMeter settings.' });
        return;
    }

    let readablePaths = 0;
    let jsonlFiles = 0;
    let parsedSample = false;

    for (const rootPath of config.paths) {
        try {
            await access(rootPath);
            readablePaths += 1;
            const files = await listJsonlFiles(rootPath);
            jsonlFiles += files.length;
            if (!parsedSample) {
                parsedSample = await canParseAnyLine(config.parser, files);
            }
        } catch {
            // Missing default paths are common before the corresponding CLI has produced a log.
        }
    }

    if (readablePaths === 0) {
        checks.push({
            name: config.name,
            severity: 'warn',
            message: `No configured/default session-log paths were found for ${config.name}.`,
        });
        return;
    }

    if (jsonlFiles === 0) {
        checks.push({
            name: config.name,
            severity: 'warn',
            message: `${config.name} paths are readable, but no JSONL session logs were found.`,
        });
        return;
    }

    checks.push({
        name: config.name,
        severity: parsedSample ? 'ok' : 'warn',
        message: parsedSample
            ? `${config.name} found ${jsonlFiles} JSONL log file(s) and parsed a usage sample.`
            : `${config.name} found ${jsonlFiles} JSONL log file(s), but no usage sample matched the parser shape.`,
    });
}

async function listJsonlFiles(rootPath: string): Promise<string[]> {
    const entries = await readdir(rootPath, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const entryPath = path.join(rootPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await listJsonlFiles(entryPath)));
        } else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
            files.push(entryPath);
        }
    }

    return files;
}

async function canParseAnyLine(parser: JsonlParser, files: string[]): Promise<boolean> {
    const newestFiles = await sortByModifiedDesc(files);
    for (const filePath of newestFiles.slice(0, 5)) {
        const content = await readFile(filePath, 'utf8');
        for (const line of content.split('\n')) {
            if (line.trim().length === 0) {
                continue;
            }
            if (parser.parseLine(line, filePath).ok) {
                return true;
            }
        }
    }
    return false;
}

async function sortByModifiedDesc(files: string[]): Promise<string[]> {
    const withStats = await Promise.all(
        files.map(async (filePath) => ({ filePath, modifiedAt: (await stat(filePath)).mtimeMs })),
    );
    return withStats.sort((left, right) => right.modifiedAt - left.modifiedAt).map((entry) => entry.filePath);
}

function catalogIsFresh(now = new Date()): boolean {
    const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
    return DEFAULT_CATALOG.every((entry) => now.getTime() - new Date(entry.verifiedAt).getTime() <= maxAgeMs);
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}