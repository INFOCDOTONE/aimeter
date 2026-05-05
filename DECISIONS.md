# DECISIONS.md — Locked Decisions Register (Track 1)

> **Every entry in this file is final.** If a future session, contractor, or contributor proposes to change one of these, that proposal needs an explicit override from the founder, recorded as a new line in the changelog with a date and reason. Otherwise, treat all entries below as non-negotiable.

> **Authority order:** This file > `SOLUTION.md` > `HANDOVER.md` > inline code comments > anything else.

> **Track:** This register applies to Track 1 (the VS Code extension). Track 2 has its own register at `_track2-saas/DECISIONS.md`.

---

## D-T1-01 · Brand and naming

| Decision | Locked value |
|---|---|
| Wordmark | `AIMeter` (camelCase, two-letter prefix) |
| Forbidden variants | `AIMETER`, `Aimeter`, `AI Meter`, `Ai Meter` |
| First mention per surface | "INFOC ONE AIMeter" — subsequent mentions are "AIMeter" |
| Family | INFOC ONE |
| Company | Infochola Solutions Pte Ltd |
| Tagline | *Meter every AI agent, in one place.* |

## D-T1-02 · Marketplace

| Decision | Locked value |
|---|---|
| Marketplace publisher ID | `infoc-one` |
| Marketplace publisher display name | `INFOC ONE` |
| Marketplace extension name | `aimeter` |
| Marketplace extension ID | `infoc-one.aimeter` |
| Display name on listing | `INFOC ONE AIMeter` |
| Open VSX namespace | `infoc-one` |
| Categories | `Other`, `Visualization` |
| Repo | `aimeter-infoc-one/` |
| GitHub org | `infoc-one` |
| Marketing page | `aimeter.infoc.one` |

**Critical:** Microsoft Marketplace publisher IDs cannot be renamed once created. Verify `infoc-one` is available BEFORE first publish (see Milestone 0 in `SOLUTION.md` §21).

## D-T1-03 · Track plan

| Decision | Locked value |
|---|---|
| Track 1 | Free VS Code extension. Built first. ~2 weeks. |
| Track 2 | Hosted SaaS for team leads. Spec frozen at `_track2-saas/`. Deferred. |
| Track-2 trigger | ≥1,000 WAU OR ≥5 inbound team-lead messages OR ≥1 paid-invoice request |
| Track-1 changes during Track 2 | Track 1 keeps shipping independently; not deprecated when Track 2 launches |

## D-T1-04 · Tech stack

### Core (locked)

| Layer | Choice | License |
|---|---|---|
| Language | TypeScript 5.7 strict | Apache-2.0 |
| Bundler | esbuild 0.24 | MIT |
| VS Code engine target | `^1.95.0` | — |
| File watcher | chokidar 4 | MIT |
| Schema validation | zod 3.24 | MIT |
| Date math | date-fns 4 | MIT |
| Webview UI | Vanilla TypeScript + hand-rolled SVG charts | — |
| Tests (unit) | Vitest 2.1 | MIT |
| Tests (integration) | @vscode/test-electron 2.4 | MIT |
| Marketplace tooling | @vscode/vsce 3.2 | MIT |
| Open VSX tooling | ovsx | EPL-2.0 (CLI tool only, not runtime) |
| Lint | eslint 9 + @typescript-eslint 8 | MIT |
| Format | prettier 3.4 | MIT |
| License audit | license-checker | BSD-3 |
| Extension license | MIT | — |

### Excluded (locked)

| Excluded | Reason |
|---|---|
| **Stripe / any payment SDK** | **No Pro tier in Track 1. Free forever.** |
| `node-machine-id` | No hardware fingerprinting |
| Telemetry SDKs (Application Insights, Mixpanel, PostHog, GoatCounter, etc.) | No telemetry to any server |
| React, Preact, Vue, Svelte | Webview is small enough that a framework adds bundle weight without value |
| Recharts, Chart.js, D3 | Hand-rolled SVG is sufficient for 3 charts |
| HTTP libraries (axios, undici, etc.) | No outbound HTTP calls in v1 except optional update check (uses native `fetch`) |
| **All Track-2 backend libs** | NestJS, Drizzle, Postgres, Keycloak, Temporal, OpenFGA, Better Auth — out of scope |

## D-T1-05 · Pricing model

| Decision | Locked value |
|---|---|
| **Track 1 pricing** | **Free forever. No Pro tier. No payment logic.** |
| Future Pro tier | NOT in Track 1. Track 2 (SaaS) handles paid features. |
| Donation / sponsorship | Not in v1. Add a "Sponsor on GitHub" link only when there's clear demand. |
| Marketplace listing | Free, no in-app purchases declared |
| License-server checks | None. Ever. |

## D-T1-06 · Open-source license policy

| Allowed (runtime deps) | Banned (runtime deps) |
|---|---|
| MIT | GPL (any version) |
| Apache-2.0 | AGPL (any version) |
| BSD-2-Clause | SSPL |
| BSD-3-Clause | BSL |
| ISC | FSL |
| PostgreSQL License | Commons Clause |
| MPL-2.0 (with review) | Proprietary |
| | Unlicensed |

CI runs `pnpm license:check` and fails on any banned license in the workspace.

## D-T1-07 · Privacy

| Decision | Locked value |
|---|---|
| Source code | Never read, never logged, never transmitted. Parsers operate on JSONL session logs only. |
| Prompts / completions | Never read, never logged, never transmitted. Parsers drop forbidden fields. |
| Workspace files / editor buffers | Never accessed. The extension does not register text-document listeners. |
| Environment variables | Never read, never logged, never transmitted. |
| File paths in stored events | Slug only (path-derived), never the absolute path |
| Telemetry to a server | None. Period. |
| Local install ID | `crypto.randomUUID()`, stored in `globalStorageUri/meta.json`. Used only for local log correlation. NEVER transmitted. |
| Settings sync (VS Code built-in) | Allowed for settings, but event data lives in `globalStorageUri` which is not synced |
| Outbound HTTP | Zero in v1, except the optional `aimeter.network.updateCheck` setting (default OFF), which makes one fetch per day to a static JSON file with no body |

A test (`tests/integration/no-network.test.ts`) intercepts all network egress and fails the build on any unexpected call.

## D-T1-08 · Pricing catalog

| Decision | Locked value |
|---|---|
| Source of truth | `src/pricing/catalog.ts` — bundled with extension |
| Format | Static array of `PricingEntry` objects |
| Update mechanism | Code change + version bump + Marketplace re-publish |
| Pre-publish freshness gate | `pnpm pricing:check` — fails if any catalog entry has `verifiedAt > 30 days ago`. **Hard gate; blocks release.** |
| User override | `aimeter.pricing.overrides` setting; takes precedence; flagged confidence high |
| Cost language | "Estimated cost" / "estimated with confidence levels." Never "actual" or "matches billing." |
| Confidence levels | high (override OR catalog ≤ 30d) / medium (catalog ≤ 90d) / low (>90d or no match) |
| Per-event snapshot | `pricingSnapshot` field freezes rates at compute time so historical totals are stable |

## D-T1-09 · Local data model

| Decision | Locked value |
|---|---|
| Storage location | `context.globalStorageUri/infoc-one.aimeter/` |
| Event format | Append-only JSONL, one file per month |
| Dedupe | In-memory id index keyed by `sha256("<agent>:<upstream_id>")` |
| Atomicity | `fs.appendFile` with `flag: 'a'`, line ends `\n` |
| Retention | Default 365 days (configurable 7–3650). Pruning runs at activation. |
| Offsets | `offsets.json` tracks per-file byte offset for resumable watching |
| Schema version | `meta.json.schemaVersion = 1`. Migrations in `src/store/migrations.ts`. |
| Cross-device sync | Not supported. Event data is per-machine by design. |

## D-T1-10 · Phase 1 scope (parsers)

| Phase 1 (in scope) | Phase 1.5 (deferred to user demand) |
|---|---|
| Claude Code | Cline |
| Codex CLI | Roo Code |
| Gemini CLI | Continue |
| | Aider |
| | Goose |
| | Copilot, Cursor, Windsurf (no usable local logs — Track 2 territory) |

## D-T1-11 · UI surfaces

| Surface | Decision |
|---|---|
| Status bar | Right-side priority 100. Format configurable: cost-today / tokens-today / both. Confidence dot when applicable. |
| Sidebar webview | Activity bar icon + view container + webview panel. Vanilla TS, CSP-locked, theme-aware. |
| Detail view | Inline within webview — session list with drill-down |
| Notifications | Used sparingly: only for user-actionable problems (perms denied, path missing). Throttled 24h per error type. |
| Output channel | Always available via `AIMeter: Show Output Logs` command |
| Theme | Light + dark via VS Code CSS vars. Custom theme overrides supported automatically. |

## D-T1-12 · Authoritative document set

| Authoritative | Non-authoritative (ignore) |
|---|---|
| `CLAUDE.md` | `_track2-saas/` (archived SaaS — out of scope for Track 1) |
| `HANDOVER.md` | Anything labelled v1 / v2 / v2.1 in older outputs |
| `SOLUTION.md` (Track-1 v1+) | Earlier deck slides referencing dropped names/scope |
| `DECISIONS.md` (this file) | Random search-result fragments not in the authoritative set |
| `README.md` | |

If a session encounters a non-authoritative file, it should **not act on it** without explicit founder confirmation. The `_track2-saas/` archive is informational only — Track 2 is frozen until the trigger criteria are met.

## D-T1-13 · Track-2 trigger criteria

Track 2 (the SaaS spec in `_track2-saas/`) is unfrozen only when at least one of these is true:

| # | Trigger |
|---|---|
| 1 | ≥ 1,000 weekly active extension users (Marketplace public install count is the proxy, since the extension ships zero telemetry) |
| 2 | ≥ 5 unsolicited inbound messages from team leads to `hello@aimeter.infoc.one` asking for team / multi-user views |
| 3 | ≥ 1 company asking for a paid invoice for team-wide rollout |

When triggered, the procedure is documented in `HANDOVER.md` § "Track-2 trigger and what to do then."

---

## How to override a decision

1. Founder sends an explicit "override D-T1-XX: <new value>; reason: <reason>" message.
2. The decision row above is updated.
3. A new entry is added to the changelog below with date, decision number, old value, new value, and reason.
4. Any `SOLUTION.md` sections affected are amended in the same commit.

---

## Changelog

- **2026-05-05 Track-1 v1.1** — Marketplace identifiers corrected. Publisher ID `infoc-one` (cannot be renamed), display name `INFOC ONE`, extension ID `infoc-one.aimeter`. Previously the docs ambiguously listed `infoc.one.aimeter` and `infoc one` as separate fields, which violated VS Code Marketplace naming rules. Authority order made explicit: DECISIONS > CLAUDE > SOLUTION > HANDOVER > README. Milestone 0 (namespace lock) added as mandatory non-coding step.
- **2026-05-05 Track-1 v1** — Initial register, locked. Free VS Code extension; SaaS spec archived. Repo `aimeter-infoc-one/`. No Pro tier, no payments, no telemetry.
