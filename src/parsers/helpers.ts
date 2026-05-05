import path from 'node:path';

export function safeJson(line: string): { ok: true; value: unknown } | { ok: false } {
    try {
        return { ok: true, value: JSON.parse(line) as unknown };
    } catch {
        return { ok: false };
    }
}

export function normalizeTimestamp(value: number | string | undefined): string {
    if (value === undefined) {
        return new Date().toISOString();
    }

    const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return new Date().toISOString();
    }
    return date.toISOString();
}

export function projectSlugFromSource(sourceFile: string, cwd: string | undefined): string {
    const raw = cwd ? path.basename(cwd) : path.basename(path.dirname(sourceFile));
    return (
        raw
            .toLowerCase()
            .replace(/[^a-z0-9._-]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80) || 'unknown-project'
    );
}