# INFOC ONE AIMeter — VS Code Extension Solution Spec (Track 1)

> **Autopilot-grade build document for the VS Code extension.** Hand this to Claude Code in a fresh VS Code workspace alongside `HANDOVER.md`, `CLAUDE.md`, and `DECISIONS.md`. Every assumption is flagged `[ASSUMPTION: …]` — override before running.

> **Authoritative document set (and ONLY these):** `CLAUDE.md`, `HANDOVER.md`, `SOLUTION.md` (this file), `DECISIONS.md`, `README.md`. The `_track2-saas/` folder contains archived SaaS docs for the future product — IGNORE during Track 1 build. Files outside this set are non-authoritative.

**Position:** Free VS Code extension that tracks AI coding-agent token usage locally for individual developers. Track 1 of a two-track plan. Track 2 (hosted SaaS for team leads) is deferred until Track 1 shows traction.

**Brand:** Infoc (company) · INFOC ONE (platform family) · AIMeter (this product)
**Wordmark:** `AIMeter` (camelCase)
**Marketplace publisher ID:** `infoc-one` (used in extension URLs; cannot be renamed once created)
**Marketplace publisher display name:** `INFOC ONE` (shown on listing; can be edited)
**Marketplace extension name:** `aimeter`
**Marketplace extension ID:** `infoc-one.aimeter`
**Repo:** `aimeter-infoc-one/`
**Marketing page:** `aimeter.infoc.one` (download + info)
**Pricing:** **Free forever. No Pro tier. No payment logic in v1.**
**Tagline:** *Meter every AI agent, in one place.*

---

## Table of contents

1. [Mission, scope, and out-of-scope](#1-mission-scope-and-out-of-scope)
2. [Conventions and naming](#2-conventions-and-naming)
3. [Tech stack with pinned versions](#3-tech-stack-with-pinned-versions)
4. [Repository layout](#4-repository-layout)
5. [Extension manifest](#5-extension-manifest)
6. [Local data model](#6-local-data-model)
7. [Cost estimation](#7-cost-estimation)
8. [Pricing catalog](#8-pricing-catalog)
9. [Parser specifications](#9-parser-specifications)
10. [Watcher and debouncing](#10-watcher-and-debouncing)
11. [UI surfaces](#11-ui-surfaces)
12. [Commands](#12-commands)
13. [Settings](#13-settings)
14. [Privacy guarantees](#14-privacy-guarantees)
15. [Error handling and logging](#15-error-handling-and-logging)
16. [Testing](#16-testing)
17. [Build and dev commands](#17-build-and-dev-commands)
18. [Lint, format, license check](#18-lint-format-license-check)
19. [CI/CD and release](#19-cicd-and-release)
20. [Marketing page (`aimeter.infoc.one`)](#20-marketing-page-aimeterinfocone)
21. [Phase 1 milestones](#21-phase-1-milestones)
22. [Track-2 trigger](#22-track-2-trigger)
23. [CLAUDE.md scaffolds](#23-claudemd-scaffolds)
24. [Definition of done](#24-definition-of-done)
25. [Assumptions index](#25-assumptions-index)

---

## 1. Mission, scope, and out-of-scope

### Mission
A free VS Code extension that gives the individual developer a single, private, **best-effort** view of their AI coding-agent token usage and **estimated** cost — across Claude Code, Codex CLI, Gemini CLI — without sending any data off the developer's machine. Token counts are pulled directly from each agent's local session logs; cost is computed from a bundled pricing catalog and presented with a confidence indicator. We never claim "actual cost" or "matches provider billing."

### In scope (Track 1, Phase 1)
- VS Code extension installable from the Marketplace as `infoc-one.aimeter`
- Three Phase-1 parsers reading local JSONL session logs: Claude Code, Codex CLI, Gemini CLI
- Local-only storage in VS Code's extension storage path
- Status bar item showing today's tokens and estimated cost
- Sidebar webview panel with breakdowns (today / 7d / 30d, by agent, by model)
- Detail view: per-session list with drill-down
- Settings panel (intervals, paths, units, opt-outs)
- Versioned pricing catalog bundled in the extension; manual override per model in settings
- Cost confidence indicators (high/medium/low) on every cost figure
- CSV export of the local data
- Cross-platform (macOS, Linux, Windows)
- Marketing page at `aimeter.infoc.one` linking to the Marketplace

### Explicitly out of scope (Track 1)
- **No SaaS backend, no API, no auth, no team features, no billing, no payment logic of any kind**
- **No telemetry to any server.** Not even anonymized usage statistics.
- No cloud sync (VS Code's settings sync, if user enables it, may sync settings — but never event data)
- No Slack integration
- No CSV upload, no team dashboards
- No Copilot, Cursor, Windsurf parsers (deferred — different log surfaces)
- No Cline, Roo Code, Continue, Aider parsers (deferred to Track 1.5 if user demand)
- No reconciliation against provider billing APIs (no network calls)
- No multi-user attribution (one machine = one user)
- No web-based UI
- No mobile companion
- No internationalization (English only)
- **No Pro tier. No paid features. Ever, in this track.**
- No license server, no entitlement check, no telemetry pixel

---

## 2. Conventions and naming

| Element | Convention | Example |
|---|---|---|
| File names | kebab-case | `usage-events.ts` |
| Directories | kebab-case | `src/parsers/` |
| TS types | PascalCase | `UsageEvent` |
| Functions, variables | camelCase | `parseClaudeCodeLine` |
| Constants | SCREAMING_SNAKE | `DEFAULT_FLUSH_MS` |
| Settings keys | camelCase under `aimeter.*` namespace | `aimeter.statusBar.enabled` |
| Commands | dot-namespaced under `aimeter.` | `aimeter.openDashboard` |
| Branding in copy | "INFOC ONE AIMeter" first mention; "AIMeter" thereafter | |
| Marketplace ID | `infoc-one.aimeter` | (locked) |

**Wordmark:** `AIMeter` (camelCase). Never `AIMETER`, `Aimeter`, or `AI Meter`.
**Commit format:** Conventional Commits.
**Branch:** `feat/<short>`, `fix/<short>`. Squash-merged into `main`.

---

## 3. Tech stack with pinned versions

> `[ASSUMPTION: latest stable as of 5 May 2026; bump to current latest if newer compatible exists at start.]`

### Runtime
- **Node.js (for build only)**: `22.11.0` LTS (`.nvmrc`)
- **pnpm**: `9.15.0`
- **TypeScript**: `5.7.2` (strict, `noUncheckedIndexedAccess: true`)
- **VS Code engine target**: `^1.95.0` (October 2024 release; gives us the modern webview API and stable secret storage)

### Extension dependencies (runtime)
- `chokidar@4.0.3` — file watching, cross-platform, awaitWriteFinish (MIT)
- `zod@3.24.1` — schema validation of parsed events (MIT)
- `date-fns@4.1.0` — date math (MIT)

That's it. The extension intentionally has a tiny runtime surface — the more deps, the more attack surface for a privacy-sensitive tool.

### Webview UI
The sidebar dashboard is a webview rendered with vanilla HTML + a small amount of CSS + plain TypeScript bundled by esbuild. No React, no framework. **Reasoning:** webviews are ephemeral, the data is small (≤30 days × few hundred events), and a framework would 5× the bundle and cold-start time for no real benefit. Charts are drawn with a tiny SVG-rendering helper (~150 lines) — Chart.js / Recharts not needed for a 3-chart panel.

`[ASSUMPTION: vanilla TS in the webview is sufficient. If complexity grows in Phase 2, evaluate Preact (3 KB) before reaching for React.]`

### Dev tooling
- `vitest@2.1.8`, `@vitest/coverage-v8@2.1.8`
- `@vscode/test-cli@0.0.10`, `@vscode/test-electron@2.4.1` — VS Code integration tests
- `@vscode/vsce@3.2.1` — Marketplace packaging + publishing
- `esbuild@0.24.2` — extension + webview bundling
- `eslint@9.17.0` flat config + `@typescript-eslint/eslint-plugin@8.19.0`
- `prettier@3.4.2`
- `husky@9.1.7`, `lint-staged@15.3.0`
- `license-checker@25.0.1`

### Notably NOT used
- **No backend.** No NestJS, no Postgres, no Keycloak, no Temporal, no OpenFGA, no SaaS.
- **No telemetry SDK.** No Application Insights, no Mixpanel, no PostHog. None.
- **No payment SDK.** No Stripe.
- **No HTTP client.** The extension makes zero outbound HTTP calls in v1 (one optional update check is a single fetch behind a setting that defaults OFF).

---

## 4. Repository layout

```
aimeter-infoc-one/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                       # typecheck, lint, test, license-check, build
│   │   └── release.yml                  # tag → vsce publish
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug.md
│   │   └── feature.md
│   └── pull_request_template.md
├── .vscode/
│   ├── launch.json                      # F5 → Extension Development Host
│   ├── tasks.json
│   ├── settings.json
│   └── extensions.json
├── src/
│   ├── extension.ts                     # entry: activate / deactivate
│   ├── lifecycle.ts                     # boot order, shutdown handlers
│   ├── store/
│   │   ├── index.ts                     # local store API
│   │   ├── persistence.ts               # JSONL on disk under globalStorageUri
│   │   ├── schema.ts                    # zod schemas for stored data
│   │   └── migrations.ts                # storage version migrations
│   ├── parsers/
│   │   ├── base.ts                      # JsonlParser abstract class
│   │   ├── claude-code.ts
│   │   ├── codex-cli.ts
│   │   ├── gemini-cli.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── pricing/
│   │   ├── catalog.ts                   # bundled DEFAULT_CATALOG
│   │   ├── compute.ts                   # cost + confidence
│   │   └── index.ts
│   ├── watcher/
│   │   ├── index.ts                     # chokidar wrapper
│   │   ├── path-resolver.ts             # OS-aware default path resolution
│   │   └── offsets.ts                   # per-file byte-offset tracking
│   ├── ui/
│   │   ├── status-bar.ts                # status bar item
│   │   ├── webview/
│   │   │   ├── panel.ts                 # webview panel host
│   │   │   ├── messages.ts              # ext ↔ webview message protocol
│   │   │   ├── index.html               # template (interpolated by panel.ts)
│   │   │   ├── webview.ts               # webview-side script (bundled separately)
│   │   │   ├── webview.css
│   │   │   └── charts.ts                # tiny SVG chart helpers
│   │   ├── commands.ts                  # command palette commands
│   │   └── notifications.ts
│   ├── settings/
│   │   ├── index.ts                     # typed config getter (no bare workspace.getConfiguration outside)
│   │   └── schema.ts                    # zod schema mirroring package.json contributes.configuration
│   ├── lib/
│   │   ├── logger.ts                    # OutputChannel-based logger
│   │   ├── time.ts
│   │   ├── id.ts                        # crypto.randomUUID wrapper
│   │   └── fs.ts
│   └── tests/
│       ├── unit/
│       │   ├── parsers/
│       │   ├── pricing/
│       │   └── store/
│       └── integration/                 # uses @vscode/test-electron
├── fixtures/                            # real JSONL samples for tests
│   ├── claude-code/
│   ├── codex-cli/
│   └── gemini-cli/
├── media/                               # icons, banners
│   ├── icon.png                         # 128×128 PNG, displayed on Marketplace
│   ├── icon-light.svg                   # status bar (light theme)
│   ├── icon-dark.svg                    # status bar (dark theme)
│   └── banner.png                       # Marketplace banner (1376×400 PNG)
├── docs/
│   ├── parsers.md                       # how to add a new parser
│   ├── pricing-catalog.md               # how to update bundled catalog
│   └── privacy.md                       # the full privacy stance
├── scripts/
│   ├── build.mjs                        # esbuild driver (extension + webview)
│   ├── package.mjs                      # vsce package wrapper
│   ├── check-licenses.js
│   └── check-pricing-freshness.ts       # CI gate: catalog ≤ 30 days old
├── package.json                         # extension manifest + npm scripts
├── tsconfig.json
├── tsconfig.webview.json
├── eslint.config.js
├── prettier.config.mjs
├── vitest.config.ts
├── .vscodeignore                        # files excluded from .vsix package
├── .gitignore
├── .nvmrc
├── .editorconfig
├── README.md                            # also displayed on Marketplace listing
├── HANDOVER.md
├── SOLUTION.md
├── CLAUDE.md
├── DECISIONS.md
├── CHANGELOG.md
├── LICENSES.md
└── LICENSE                              # [ASSUMPTION: MIT for the extension itself, makes Marketplace listing cleaner]
```

---

## 5. Extension manifest

`package.json` core fields:

```json
{
  "name": "aimeter",
  "displayName": "INFOC ONE AIMeter",
  "description": "Meter every AI agent, in one place. Track Claude Code, Codex CLI, Gemini CLI token usage locally and privately.",
  "version": "0.1.0",
  "publisher": "infoc-one",
  "license": "MIT",
  "icon": "media/icon.png",
  "engines": { "vscode": "^1.95.0" },
  "categories": ["Other", "Visualization"],
  "keywords": ["ai", "tokens", "cost", "claude", "codex", "gemini", "finops", "usage", "metering"],
  "repository": { "type": "git", "url": "https://github.com/infoc-one/aimeter-infoc-one" },
  "bugs": { "url": "https://github.com/infoc-one/aimeter-infoc-one/issues" },
  "homepage": "https://aimeter.infoc.one",
  "main": "./dist/extension.js",
  "activationEvents": ["onStartupFinished"],
  "contributes": {
    "commands": [
      { "command": "aimeter.openDashboard", "title": "AIMeter: Open Dashboard" },
      { "command": "aimeter.exportCsv", "title": "AIMeter: Export CSV…" },
      { "command": "aimeter.refresh", "title": "AIMeter: Refresh Now" },
      { "command": "aimeter.clearData", "title": "AIMeter: Clear All Stored Data…" },
      { "command": "aimeter.openLogs", "title": "AIMeter: Show Output Logs" },
      { "command": "aimeter.runDoctor", "title": "AIMeter: Run Doctor (Diagnostics)" }
    ],
    "viewsContainers": {
      "activitybar": [
        { "id": "aimeter", "title": "AIMeter", "icon": "media/icon-dark.svg" }
      ]
    },
    "views": {
      "aimeter": [
        { "id": "aimeter.dashboard", "name": "Dashboard", "type": "webview" }
      ]
    },
    "configuration": {
      "title": "AIMeter",
      "properties": {
        "aimeter.statusBar.enabled": { "type": "boolean", "default": true, "description": "Show AIMeter in the status bar." },
        "aimeter.statusBar.format": { "type": "string", "enum": ["cost-today", "tokens-today", "both"], "default": "cost-today", "description": "What to show in the status bar." },
        "aimeter.refreshIntervalSec": { "type": "number", "default": 30, "minimum": 5, "maximum": 600, "description": "How often the watcher debounces and reads new lines, in seconds." },
        "aimeter.parsers.claudeCode.enabled": { "type": "boolean", "default": true },
        "aimeter.parsers.claudeCode.paths": { "type": "array", "items": { "type": "string" }, "default": [], "description": "Override default ~/.claude/projects path. Empty = use default." },
        "aimeter.parsers.codexCli.enabled": { "type": "boolean", "default": true },
        "aimeter.parsers.codexCli.paths": { "type": "array", "items": { "type": "string" }, "default": [] },
        "aimeter.parsers.geminiCli.enabled": { "type": "boolean", "default": true },
        "aimeter.parsers.geminiCli.paths": { "type": "array", "items": { "type": "string" }, "default": [] },
        "aimeter.pricing.overrides": { "type": "object", "default": {}, "description": "Per-model rate overrides keyed by model id." },
        "aimeter.retention.days": { "type": "number", "default": 365, "minimum": 7, "maximum": 3650, "description": "Days of event history to keep locally before pruning." },
        "aimeter.network.updateCheck": { "type": "boolean", "default": false, "description": "Allow AIMeter to make ONE outbound request per day to check for catalog updates. OFF by default." }
      }
    },
    "menus": {
      "view/title": [
        { "command": "aimeter.refresh", "when": "view == aimeter.dashboard", "group": "navigation" },
        { "command": "aimeter.exportCsv", "when": "view == aimeter.dashboard", "group": "navigation" }
      ]
    }
  }
}
```

---

## 6. Local data model

All data lives under `context.globalStorageUri` (VS Code-managed, per-installation). No data leaves the machine.

```
~/.../globalStorage/infoc-one.aimeter/
├── events/
│   ├── 2026-04.jsonl          # one JSONL file per month, append-only
│   ├── 2026-05.jsonl
│   └── …
├── offsets.json                # per-watched-file byte offset
├── catalog-overrides.json      # user pricing overrides (settings-mirror)
├── meta.json                   # storage schema version, install id
└── logs/
    └── extension.log           # daily-rotated, 5 files × 5 MB max
```

### Event record (zod-validated)

```ts
type StoredEvent = {
  id: string;                    // sha256("<agent>:<upstream_id>")
  agent: 'claude-code' | 'codex-cli' | 'gemini-cli';
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsdEstimated: number;      // computed at parse time
  costConfidence: 'high' | 'medium' | 'low';
  pricingSource: 'default' | 'user_override';
  pricingSnapshot: {             // frozen rates at compute time
    inputPerMillion: number;
    outputPerMillion: number;
    cacheReadPerMillion: number;
    cacheWritePerMillion: number;
    catalogVerifiedAt: string;
  };
  project?: string;              // path-derived slug, never the actual path
  sessionId?: string;
  ts: string;                    // ISO 8601 UTC
};
```

### Storage rules
- **Append-only by month.** Each new event appends one JSON line to the current month's file. No in-place edits.
- **Idempotent.** Before append, check the in-memory index keyed by `id`. The index is rebuilt at activation by streaming the latest 90 days of events.
- **Pruned on activation.** Files older than `retention.days` are deleted at startup.
- **Atomic writes.** Each append is `fs.appendFile` with `flag: 'a'`. JSONL line ends with `\n`. Crash-resilient.

### Schema version
`meta.json.schemaVersion: 1`. If a future version changes the event shape, `migrations.ts` handles upgrade in place at activation.

### Install ID
`meta.json.installId`: `crypto.randomUUID()`, generated on first activation, stored locally. **Never transmitted.** Used only as a debug correlation key in local logs.

---

## 7. Cost estimation

**Cost figures are estimates. Always.** The extension never claims to match provider billing.

### Compute (`src/pricing/compute.ts`)

```ts
export type ComputeResult = {
  costUsdEstimated: number;
  costConfidence: 'high' | 'medium' | 'low';
  pricingSource: 'default' | 'user_override';
  pricingSnapshot: PricingSnapshot;
};

export function computeCost(event: ParsedEventInput, ctx: ComputeCtx): ComputeResult {
  // 1. user override?  → user_override; confidence high
  // 2. bundled catalog match?
  //    → default
  //    → confidence high if (now - catalog.verifiedAt) ≤ 30 days
  //    → confidence medium if (now - catalog.verifiedAt) ≤ 90 days
  //    → confidence low otherwise
  // 3. no match → cost 0; confidence low
}
```

### Confidence levels in the UI
- **High** — green dot, no caveat
- **Medium** — yellow dot, hover shows "rates verified more than 30 days ago"
- **Low** — gray dot, hover shows "no rate found for this model — cost shown as 0"

Total cost figures show the **lowest confidence** of any contributing event. Mixed: yellow.

---

## 8. Pricing catalog

Bundled in `src/pricing/catalog.ts`. **No DB, no network fetch.** Updates ship with extension version bumps.

```ts
export type PricingEntry = {
  provider: 'anthropic' | 'openai' | 'google';
  model: string;                      // canonical model id
  aliases?: string[];                 // dated suffixes etc.
  inputPerMillion: number;
  outputPerMillion: number;
  cacheReadPerMillion: number;
  cacheWritePerMillion: number;
  effectiveFrom: string;              // ISO date
  verifiedAt: string;                 // ISO date — gated by CI
  sourceUrl: string;
};

export const DEFAULT_CATALOG: PricingEntry[] = [
  // Anthropic
  { provider: 'anthropic', model: 'claude-opus-4-7',
    inputPerMillion: 15.00, outputPerMillion: 75.00,
    cacheReadPerMillion: 1.50, cacheWritePerMillion: 18.75,
    effectiveFrom: '2026-04-01', verifiedAt: '2026-05-05',
    sourceUrl: 'https://www.anthropic.com/pricing' },
  // … claude-opus-4-6, claude-sonnet-4-6, claude-haiku-4-5
  // … gpt-5, gpt-5-codex, gpt-4.1, o4-mini
  // … gemini-3-flash, gemini-3-pro
];
```

### Pre-publish gate
`scripts/check-pricing-freshness.ts` runs in CI before `vsce publish`. **Blocks the release** if any catalog entry has `verifiedAt > 30 days ago`. Forces the maintainer to re-verify rates before each Marketplace release.

This is a hard gate, not a warning.

### User override
Settings → `aimeter.pricing.overrides`:
```json
{
  "claude-opus-4-7": {
    "inputPerMillion": 12.00,
    "outputPerMillion": 60.00,
    "cacheReadPerMillion": 1.20,
    "cacheWritePerMillion": 15.00
  }
}
```
Takes precedence; flagged as `user_override` with confidence `high`.

---

## 9. Parser specifications

### Common contract (`src/parsers/base.ts`)

```ts
export abstract class JsonlParser {
  abstract readonly agent: 'claude-code' | 'codex-cli' | 'gemini-cli';
  abstract defaultPaths(homedir: string, platform: NodeJS.Platform): string[];
  abstract parseLine(line: string, file: string): ParsedEventInput[];
}
```

### Claude Code parser
- **Default paths:** `~/.claude/projects/**/*.jsonl`
- **Mapping:** `id = sha256("claude-code:" + message.id)`, `model = message.model`, `inputTokens = usage.input_tokens`, etc., `ts = timestamp`, `project` = path-derived slug from `.../projects/<slug>/...` (slug only, never full path)
- **Defensive:** drop record if `usage` absent. Treat missing fields as 0.

### Codex CLI parser
- **Default paths:** `~/.codex/sessions/**/*.jsonl`
- **Mapping:** `prompt_tokens` → `inputTokens`, `completion_tokens` → `outputTokens`, `cached_tokens` → `cacheReadTokens`, `created_at` (epoch s) or `timestamp` (ISO) → `ts`

### Gemini CLI parser
- **Default paths:** `~/.gemini/sessions/**/*.jsonl` `[ASSUMPTION: verify exact log location and JSONL schema before writing — Gemini CLI in active development]`
- **Mapping:** `usageMetadata.promptTokenCount` → `inputTokens`, `candidatesTokenCount` → `outputTokens`, `cachedContentTokenCount` → `cacheReadTokens`

### Field-drop policy (privacy)

Each parser has a **deny-list** of fields it must drop if encountered:
```ts
const FORBIDDEN_FIELDS = [
  'content', 'text', 'message.content', 'completion', 'prompt',
  'system_prompt', 'messages', 'response', 'choices[].message.content',
  'tool_use.input', 'tool_result.content', 'output', 'input',
];
```
A test asserts that no parser ever returns any field outside the strict `ParsedEventInput` zod schema, even if upstream JSONL contains extra keys. **This is a P0 invariant.**

### Fixtures and tests

Each parser ships ≥3 anonymized JSONL fixtures in `fixtures/<agent>/v<n>.jsonl`. Tests assert exact normalized output and that no forbidden fields leak through.

---

## 10. Watcher and debouncing

- `chokidar@4` with `awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 }`
- Watches the union of `parsers.<agent>.paths` (default if empty) for each enabled parser
- Per-file byte offset tracked in `offsets.json`; on change event, read from offset → end, parse new full lines, persist offset
- Debounce per-file: 300 ms after last write event
- Global flush interval: `aimeter.refreshIntervalSec` (default 30 s) — also triggers UI refresh signal
- Watcher errors logged to OutputChannel; never crash the extension

### Activation cost
Activation is `onStartupFinished` (not `*`), so VS Code starts before AIMeter does any work. First scan only reads new bytes since last shutdown — typically <50 ms.

---

## 11. UI surfaces

### Status bar
- Right side, priority `100`
- Format per setting: `$(graph) $4.27 today` or `$(graph) 412k tokens today`
- Tooltip: "AIMeter — click to open dashboard"
- Click → `aimeter.openDashboard`
- Updates on every flush; no flicker (debounced 200 ms)
- Confidence dot prepended when total has medium/low confidence: `🟡 $4.27 today`

### Sidebar webview ("Dashboard")
Activity bar icon → AIMeter view → webview panel.

Layout (top to bottom):
1. **Window picker:** Today / 7d / 30d / Custom
2. **Three summary cards:** Tokens · Estimated cost · Events. Each shows confidence indicator.
3. **Daily trend** SVG bar chart, color-segmented by agent
4. **By agent** horizontal bars
5. **By model** sortable table (model · tokens · cost · count)
6. **Recent sessions** list — last 50, click to expand a session's events

Empty state:
```
No events yet.

AIMeter watches:
   ✔  ~/.claude/projects (Claude Code)
   ✔  ~/.codex/sessions (Codex CLI)
   ✘  ~/.gemini/sessions (not found)

Run an AI session in any of the above tools to start seeing data here.
[Run Doctor]  [Open Settings]
```

### Detail view
Webview message protocol (`ext ↔ webview`):

```ts
type FromExtension =
  | { type: 'window-data'; payload: WindowData }
  | { type: 'session-detail'; payload: SessionDetail }
  | { type: 'doctor-result'; payload: DoctorResult }
  | { type: 'error'; message: string };

type FromWebview =
  | { type: 'request-window'; payload: { window: 'today' | '7d' | '30d' | { from: string; to: string } } }
  | { type: 'request-session'; payload: { sessionId: string } }
  | { type: 'export-csv' }
  | { type: 'run-doctor' }
  | { type: 'open-settings' };
```

All messages zod-validated on both sides. Webview CSP restricts to `default-src 'none'; script-src 'nonce-{nonce}'; style-src 'unsafe-inline'`.

---

## 12. Commands

| Command | Title | Behavior |
|---|---|---|
| `aimeter.openDashboard` | Open Dashboard | Reveals the sidebar view |
| `aimeter.exportCsv` | Export CSV… | Save dialog → writes CSV with all events in current window |
| `aimeter.refresh` | Refresh Now | Force-flush watcher and re-render UI |
| `aimeter.clearData` | Clear All Stored Data… | Modal warning → wipes `globalStorageUri/events/` |
| `aimeter.openLogs` | Show Output Logs | Shows the AIMeter OutputChannel |
| `aimeter.runDoctor` | Run Doctor (Diagnostics) | Runs path / perms / parse-sample checks; output in webview |

CSV columns: `timestamp,agent,model,input,output,cache_r,cache_w,cost_usd_estimated,confidence,pricing_source,project,session_id`.

### Doctor checks
1. Each enabled parser path exists and is readable
2. ≥1 JSONL file in each path with size > 0
3. Sample-parse the most recent line — successful?
4. Storage path writable? Free space > 50 MB?
5. Pricing catalog contains entries verified within last 90 days?
6. Refresh interval reasonable (5–600 s)?

---

## 13. Settings

All settings under the `aimeter.*` namespace. See `package.json contributes.configuration` in §5.

Typed access: `src/settings/index.ts` exposes `getSettings(): AimeterSettings` returning a zod-validated typed object. **No `vscode.workspace.getConfiguration('aimeter').get(...)` calls outside this module.** ESLint rule enforces.

---

## 14. Privacy guarantees

These are **product promises**, listed verbatim on the Marketplace listing and `aimeter.infoc.one`.

1. **No data leaves your machine.** The extension makes zero outbound HTTP calls in v1, except the optional `network.updateCheck` (default OFF; one fetch per day to a static JSON file when ON; never sends any data).
2. **No source code is ever read.** Parsers operate on JSONL session-log files only — never on workspace files, never on editor buffers.
3. **No prompts or completions are ever read.** Parsers explicitly drop these fields.
4. **No machine fingerprinting.** The optional `installId` is `crypto.randomUUID()` generated locally, used only for local log correlation. Never transmitted.
5. **No telemetry.** No Application Insights, no PostHog, no analytics. None.
6. **No accounts, no auth, no API keys** — there is nothing to sign in to.
7. **All settings sync via VS Code's built-in settings sync if the user enables it.** Event data is in `globalStorageUri`, which is **not** synced by VS Code. Event data stays on each machine.
8. **You can wipe all stored data anytime** via `AIMeter: Clear All Stored Data…`.

A test (`tests/integration/no-network.test.ts`) intercepts all network calls during integration runs and **fails the build if any network call is made**, except the explicit single update-check URL when the setting is on.

---

## 15. Error handling and logging

### Logger
A single `vscode.OutputChannel('AIMeter')` accessed via `lib/logger.ts`. Levels: `debug` / `info` / `warn` / `error`. JSON format with `ts`, `level`, `module`, `msg`, `meta`.

### Error UX
- **Recoverable** (parse error on a single line, transient FS error) — log warn, continue
- **User-actionable** (path not found, perms denied) — surface as `vscode.window.showWarningMessage` with "Open Settings" button, throttled to once per 24h per error type
- **Bug** (zod assertion fails, internal invariant broken) — log error, show toast "AIMeter: an internal error occurred — see Output for details" with "Show Logs" button

Never crash the extension host. Every async boundary wrapped in `try/catch`.

### File log
Mirror to `globalStorageUri/logs/extension.log`, daily-rotated, 5 files × 5 MB max. Useful when user files an issue.

---

## 16. Testing

### Unit (vitest, runs without VS Code)
- Each parser × ≥3 fixtures: assert exact normalized output, assert no forbidden fields leak
- Pricing compute: confidence levels, snapshot stability, override precedence
- Store persistence: append, dedupe, prune-by-retention
- Path resolver: macOS, Linux, Windows, with various HOME values

### Integration (`@vscode/test-electron`)
- Activation completes within 1 s on a clean profile
- Status bar item appears, updates after a fixture file is dropped into a watched dir
- Webview opens, renders empty state, then renders data after fixture activity
- Export CSV writes a non-empty file with correct headers
- Clear-data command wipes events and resets UI to empty state
- Doctor reports correct status across mixed paths
- **No-network test:** intercept all network egress → assert zero calls during a 60-second activation + use cycle

### Coverage
- ≥85% on parsers, pricing, store
- ≥70% overall

### Marketplace pre-publish manual smoke
1. Package locally with `pnpm package`
2. Install the `.vsix` in a fresh VS Code profile
3. Run a real Claude Code session for 5 minutes
4. Verify status bar updates, webview shows data, CSV export works
5. Inspect file system: confirm only `globalStorageUri/infoc-one.aimeter/` is touched

---

## 17. Build and dev commands

### Root `package.json` scripts

```json
{
  "scripts": {
    "dev":             "node scripts/build.mjs --watch",
    "build":           "node scripts/build.mjs",
    "package":         "pnpm build && vsce package --no-dependencies -o dist/aimeter-${npm_package_version}.vsix",
    "publish":         "vsce publish --no-dependencies",
    "lint":            "eslint .",
    "lint:fix":        "eslint . --fix",
    "format":          "prettier --write .",
    "typecheck":       "tsc --noEmit && tsc --noEmit -p tsconfig.webview.json",
    "test":            "vitest run",
    "test:watch":      "vitest",
    "test:cov":        "vitest run --coverage",
    "test:vscode":     "vscode-test",
    "license:check":   "node scripts/check-licenses.js",
    "pricing:check":   "tsx scripts/check-pricing-freshness.ts",
    "prepare":         "husky"
  }
}
```

### Dev loop
1. `pnpm install`
2. `pnpm dev` (esbuild --watch)
3. F5 in VS Code → Extension Development Host opens
4. Drop fixture JSONL files into `~/.claude/projects/test/`
5. Watch the status bar update

### Bundle layout
- `dist/extension.js` — extension main (Node target)
- `dist/webview.js` — webview script (browser target)
- `dist/webview.css`
- `media/*` — copied as-is

---

## 18. Lint, format, license check

### `eslint.config.js` (flat)
- `@typescript-eslint/recommended-type-checked`
- Rules: `no-floating-promises: error`, `no-explicit-any: error`, `consistent-type-imports: error`, `prefer-const: error`
- Custom rule: ban `vscode.workspace.getConfiguration` outside `src/settings/`
- Custom rule: ban `fetch`, `http`, `https`, `node:http`, `node:https`, `axios`, `undici` imports outside `src/lib/update-check.ts`

### `prettier.config.mjs`
```js
export default {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  arrowParens: 'always',
};
```

### License check
Runtime deps must be in: MIT / Apache-2.0 / BSD-2 / BSD-3 / ISC / PostgreSQL / MPL-2.0.
Banned: GPL / AGPL / SSPL / BSL / FSL / Commons Clause / unlicensed.
`scripts/check-licenses.js` parses `pnpm licenses list --json` and fails on violations.

### Pre-commit (husky + lint-staged)
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{md,json,css}": ["prettier --write"]
  }
}
```

---

## 19. CI/CD and release

### `.github/workflows/ci.yml`

```yaml
name: CI
on: [pull_request, push]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.15.0 }
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm license:check
      - run: pnpm build
      - run: xvfb-run -a pnpm test:vscode
        if: runner.os == 'Linux'
```

### `.github/workflows/release.yml`

```yaml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.15.0 }
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck && pnpm lint && pnpm test && pnpm license:check
      - run: pnpm pricing:check          # HARD GATE: catalog ≤ 30d
      - run: pnpm build
      - run: pnpm package
      - run: pnpm publish
        env:
          VSCE_PAT: ${{ secrets.VSCE_PAT }}
      # Also publish to Open VSX for Cursor / VSCodium / Gitpod users
      - run: pnpm dlx ovsx publish dist/*.vsix -p ${{ secrets.OVSX_PAT }}
```

### Release checklist (in `docs/release.md`)
1. Re-verify pricing catalog against Anthropic / OpenAI / Google pricing pages; bump `verifiedAt` dates
2. Update `CHANGELOG.md`
3. Bump version in `package.json` (semver)
4. Tag `v0.X.Y` and push
5. CI publishes to Marketplace + Open VSX
6. Smoke-test the published extension in a fresh profile

---

## 20. Marketing page (`aimeter.infoc.one`)

A single static page. **Not part of the extension repo** — separate tiny repo or a static `index.html` deployed to any static host. Out of scope for the extension build but documented here for completeness.

Sections:
1. **Hero:** "Meter every AI agent, in one place." · "Free VS Code extension. Local. Private. Open source."
2. **Install button:** big, deep-links to `vscode:extension/infoc-one.aimeter` and links to Marketplace + Open VSX
3. **What it tracks:** Claude Code, Codex CLI, Gemini CLI logos
4. **Three privacy promises** (from §14 above): no data leaves your machine, no source code read, no telemetry
5. **Screenshots:** status bar, dashboard, settings
6. **FAQ:** 6 entries — agents supported, where data lives, accuracy, offline, self-host, can I trust this
7. **Footer:** GitHub repo, issue tracker, `hello@aimeter.infoc.one`

`[ASSUMPTION: Built with plain HTML + Tailwind via CDN; deploys as a static file to Cloudflare Pages or similar. ~1 day of work, separate from the extension build.]`

---

## 21. Phase 1 milestones

### Milestone 0 — Namespace lock (must complete BEFORE coding)

Marketplace publisher IDs cannot be renamed once created. Locking the namespace before any code is written prevents an expensive rename later.

- [ ] Marketplace publisher ID `infoc-one` registered and verified at https://marketplace.visualstudio.com/manage
- [ ] Marketplace publisher display name set to `INFOC ONE`
- [ ] Open VSX namespace `infoc-one` claimed at https://open-vsx.org
- [ ] GitHub org `infoc-one` exists; private repo `infoc-one/aimeter-infoc-one` created
- [ ] Extension ID confirmed available as `infoc-one.aimeter` (search Marketplace; the slot must be unclaimed)
- [ ] Azure DevOps PAT created with `Marketplace > Manage` scope; stored as repo secret `VSCE_PAT`
- [ ] Open VSX PAT created; stored as repo secret `OVSX_PAT`
- [ ] DNS for `aimeter.infoc.one` configured (CNAME or A record to static-host target)
- [ ] Email forwarding for `hello@aimeter.infoc.one`, `support@aimeter.infoc.one`, `security@aimeter.infoc.one` working
- [ ] License decision (`MIT` per `[ASSUMPTION]`) double-checked; `LICENSE` file ready

**Acceptance:** Every item above is checked. If any item is blocked (e.g., publisher ID `infoc-one` is already taken), pause and pick an alternative; do NOT proceed to Milestone 1 with a temporary or wrong identifier.

### Milestone 1 — Skeleton & first parser (Days 1–3)

- [ ] Init repo with the layout from §4
- [ ] `package.json` manifest configured per §5
- [ ] esbuild config for extension + webview
- [ ] `src/extension.ts` activates, registers commands, creates output channel
- [ ] Status bar item shows "AIMeter — no data yet"
- [ ] `src/store/` — append-only JSONL persistence with offsets
- [ ] Claude Code parser + 3 fixtures + tests
- [ ] Watcher wired for Claude Code path only
- [ ] F5 dev loop works; running a Claude Code session produces data in store

**Acceptance:** F5 → Extension Development Host. Drop a fixture JSONL into `~/.claude/projects/dev-test/` → status bar updates within 30 s with non-zero tokens. CSV export not yet — but events visible in raw store file.

### Milestone 2 — Webview dashboard (Days 4–6)

- [ ] Sidebar view container + webview panel
- [ ] Webview message protocol with zod validation
- [ ] Three summary cards rendered from store query
- [ ] Daily trend SVG chart (vanilla TS, ~150 lines)
- [ ] By-agent + by-model breakdowns
- [ ] Window picker (Today / 7d / 30d)
- [ ] Empty state and confidence indicators
- [ ] Light + dark theme support via VS Code CSS variables

**Acceptance:** Dashboard opens in <500 ms with seeded data. Window picker re-queries instantly. Confidence dots visible. Renders correctly in both light and dark themes.

### Milestone 3 — Codex + Gemini parsers + commands (Days 7–9)

- [ ] Codex CLI parser + 3 fixtures + tests
- [ ] Gemini CLI parser + 3 fixtures + tests `[ASSUMPTION: Gemini schema verified at start of this milestone]`
- [ ] All three parsers running concurrently in the watcher
- [ ] Doctor command implemented; results rendered in webview
- [ ] CSV export command working
- [ ] Refresh, Clear Data, Open Logs commands

**Acceptance:** With all three agents producing fixture data, dashboard shows correct per-agent breakdown. Doctor reports each agent's status. CSV export contains expected columns and matches dashboard totals.

### Milestone 4 — Settings, polish, marketplace prep (Days 10–12)

- [ ] All settings exposed per §13
- [ ] User pricing override flow tested end-to-end
- [ ] Status bar formats (cost-today / tokens-today / both) work
- [ ] Pre-publish gate: `pnpm pricing:check` enforces ≤30-day verification
- [ ] No-network test passes
- [ ] Marketplace assets: `icon.png`, `banner.png`, screenshots in `media/screenshots/`
- [ ] `README.md` final (also Marketplace listing copy)
- [ ] CI pipeline green; integration tests passing on Linux runner
- [ ] Tag `v0.1.0-rc.1`, build `.vsix`, install in fresh profile, smoke test

**Acceptance:** A clean VS Code install + Claude Code session for 30 minutes produces accurate readings, settings work, no errors in OutputChannel, no network calls observed, pricing freshness gate passes.

### Milestone 5 — Marketplace publish (Day 13)

- [ ] `vsce publish` to Marketplace as `infoc-one.aimeter` (publisher ID `infoc-one`)
- [ ] `ovsx publish` to Open VSX
- [ ] Marketing page at `aimeter.infoc.one` live
- [ ] Initial outreach: post on r/vscode, r/ChatGPTCoding, r/ClaudeAI, Hacker News Show HN, dev.to
- [ ] Monitor first 48 hours: install count, GitHub issues, error reports

**Acceptance:** Extension installable from Marketplace by anyone via `code --install-extension infoc-one.aimeter`. ≥10 installs within 48h. Zero P0 bugs reported.

---

## 22. Track-2 trigger

Track 2 (the SaaS at `aimeter.infoc.one` for team leads) does **not** start until at least one of the following is true:

1. **≥1,000 weekly active extension users** (measured via Marketplace public install count, since the extension itself ships no telemetry — public counts are the only signal we'll have)
2. **≥5 unsolicited inbound messages** from team leads to `hello@aimeter.infoc.one` asking "can my team see this together?" or equivalent
3. **≥1 company asking for a paid invoice** for team-wide rollout

When triggered, the Track 2 spec lives at `_track2-saas/SOLUTION.md` and Track 1 packages (`@one/aimeter-parsers`, `@one/aimeter-pricing`) are extracted from the extension and published to npm to be reused by the SaaS.

Until triggered, **the SaaS spec is frozen.** No work on Keycloak realms, Temporal workflows, OpenFGA models, or any of it.

---

## 23. CLAUDE.md scaffolds

### `/CLAUDE.md` (root)
See the separate `CLAUDE.md` file in the authoritative document set.

### `src/parsers/CLAUDE.md`
```md
Each parser implements JsonlParser from base.ts. Add ≥3 anonymized fixtures
in /fixtures/<agent>/ and tests asserting exact normalized output.

Forbidden-field policy is a P0 invariant: parsers MUST NEVER return
fields that could contain source code, prompts, or completions. The test
no-forbidden-fields.test.ts enforces this against the strict zod schema.

Tolerate missing optional fields by treating them as 0. Tolerate dated
model suffixes (-20251001) by stripping them before catalog lookup.
```

### `src/store/CLAUDE.md`
```md
Append-only JSONL per month. NEVER edit a previous line. Dedup at append-time
via the in-memory id index. Atomic writes only (fs.appendFile with flag 'a').

The store schema is the source of truth in schema.ts. Bump schemaVersion
in meta.json and add a migration in migrations.ts when changing event shape.
```

### `src/pricing/CLAUDE.md`
```md
Cost is ALWAYS estimated. Never claim "matches provider billing."
Snapshot the rates in pricingSnapshot at compute time so historical
totals stay stable when the catalog updates.

Confidence: high if catalog verifiedAt ≤ 30d OR user override; medium if
≤ 90d; low otherwise. No catalog match → cost 0, confidence low.
```

### `src/ui/webview/CLAUDE.md`
```md
Vanilla TypeScript only — no React, no Preact in v1. SVG charts hand-rolled.
Strict CSP: nonce-based scripts, no inline event handlers.
ext ↔ webview messages zod-validated on both sides.
Light/dark theme via VS Code CSS vars (var(--vscode-foreground) etc).
```

---

## 24. Definition of done

### Repo health
- [ ] `pnpm install --frozen-lockfile` succeeds on fresh clone with Node 22.11
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:vscode`, `pnpm license:check`, `pnpm build` all exit 0
- [ ] `pnpm pricing:check` exit 0 (catalog ≤ 30d)
- [ ] CI green on `main`
- [ ] No banned tech imported (no Stripe, no telemetry SDK, no backend libs)

### Functional
- [ ] Extension installs from a `.vsix` into a clean VS Code profile without errors
- [ ] Activation finishes < 1 s
- [ ] Status bar shows accurate "today" figure within 60 s of an AI session
- [ ] Sidebar dashboard renders in < 500 ms
- [ ] Window picker switches data instantly
- [ ] Confidence dots correct on all cost figures
- [ ] CSV export contains expected columns and matches dashboard totals
- [ ] Clear Data wipes events and resets UI to empty state
- [ ] Doctor reports accurate path / parse / catalog status
- [ ] Settings changes (intervals, paths, overrides) take effect without restart
- [ ] Light + dark theme both render correctly

### Privacy
- [ ] No-network integration test passes (zero outbound HTTP during 60-s activation cycle)
- [ ] Forbidden-field test passes (no parser leaks source code / prompts / completions)
- [ ] Privacy promises in §14 verified by reading the code
- [ ] No `installId`, `clientId`, or any local identifier ever appears in any HTTP body — verified by network test

### Documentation
- [ ] `README.md` final, doubles as Marketplace listing
- [ ] `HANDOVER.md`, `SOLUTION.md`, `CLAUDE.md`, `DECISIONS.md` consistent
- [ ] `CHANGELOG.md` has v0.1.0 entry
- [ ] `LICENSES.md` lists every dependency + license
- [ ] Per-directory `CLAUDE.md` files in `src/parsers/`, `src/store/`, `src/pricing/`, `src/ui/webview/`

### Marketplace
- [ ] Icon, banner, screenshots all present in `media/`
- [ ] `package.json` manifest validates via `vsce ls` without warnings
- [ ] Listing description, keywords, categories sensible
- [ ] Marketing page at `aimeter.infoc.one` live and links to Marketplace
- [ ] Published to both VS Code Marketplace and Open VSX

### Track-2 readiness
- [ ] `_track2-saas/` archive intact and untouched during Track 1 build
- [ ] Track-2 trigger criteria documented in §22
- [ ] Track-1 packages structured so `parsers/` and `pricing/` can be extracted to npm packages later without code changes

When all boxes are checked, Phase 1 is done.

---

## 25. Assumptions index

1. § 3 — Latest stable versions of all deps as of 5 May 2026; bump if newer compatible exists at start.
2. § 3 — Vanilla TypeScript in webview is sufficient; reach for Preact only if Phase 2 complexity requires it.
3. § 4 — License is MIT for the extension; double-check this aligns with company policy before publish.
4. § 9 — Gemini CLI exact log location and JSONL schema verified at the start of Milestone 3 (the schema may have changed since the SaaS spec was drafted).
5. § 20 — Marketing page is plain HTML + Tailwind CDN, deployed to Cloudflare Pages or similar, separate from extension repo.
6. § 22 — Track-2 trigger thresholds (1,000 WAU / 5 inbound / 1 paid invoice) are working assumptions; founder may adjust.

Override any assumption by editing this file before starting work.

---

*Last updated: 5 May 2026 — Track 1 v1*

## Changelog

- **2026-05-05 Track-1 v1.1** — Pre-build patches: Marketplace publisher ID and extension ID corrected (publisher ID `infoc-one`, display name `INFOC ONE`, extension ID `infoc-one.aimeter` — was incorrectly `infoc.one.aimeter`); Milestone 0 added as mandatory non-coding namespace-lock milestone; mission language softened from "accurate" to "best-effort estimated"; explicit publisher-ID-vs-display-name distinction documented per VS Code Marketplace requirements.
- **2026-05-05 Track-1 v1** — Initial Track-1 spec for the VS Code extension. Free forever, no Pro tier, no payment logic, no telemetry, no backend. Repo `aimeter-infoc-one/`. Track-2 SaaS spec archived in `_track2-saas/`.
