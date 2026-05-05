# INFOC ONE AIMeter

> Meter every AI agent, in one place.

A free VS Code extension that tracks AI coding-agent token usage locally and privately. AIMeter reads local JSONL session logs from Claude Code, Codex CLI, and Gemini CLI, then shows token totals and estimated cost inside VS Code.

---

## What it does

- Tracks Claude Code, Codex CLI, and Gemini CLI usage from local session logs
- Shows today's estimated cost or token count in the status bar
- Provides a sidebar dashboard for Today, 7d, and 30d windows
- Breaks usage down by agent, model, and recent session
- Exports local event data to CSV
- Runs a Doctor check for parser paths, readable logs, storage, and pricing freshness
- Supports per-model pricing overrides for local estimates

All costs are estimates with confidence indicators. AIMeter never claims to match provider billing.

## Privacy

AIMeter is local-first by design:

- No telemetry, analytics, accounts, auth, or API keys
- No source code or editor buffers are read
- No prompts or completions are stored
- No outbound HTTP calls except the optional update check, which is off by default
- Event data stays in VS Code's extension storage on your machine
- You can clear stored data any time with `AIMeter: Clear All Stored Data...`

## Commands

- `AIMeter: Open Dashboard`
- `AIMeter: Export CSV...`
- `AIMeter: Refresh Now`
- `AIMeter: Clear All Stored Data...`
- `AIMeter: Show Output Logs`
- `AIMeter: Run Doctor (Diagnostics)`

## Settings

- `aimeter.statusBar.enabled`
- `aimeter.statusBar.format`: `cost-today`, `tokens-today`, or `both`
- `aimeter.parsers.claudeCode.*`
- `aimeter.parsers.codexCli.*`
- `aimeter.parsers.geminiCli.*`
- `aimeter.pricing.overrides`
- `aimeter.retention.days`
- `aimeter.network.updateCheck`

Pricing override example:

```json
{
	"aimeter.pricing.overrides": {
		"gpt-5": {
			"inputUsdPerMillion": 1.25,
			"outputUsdPerMillion": 10,
			"cacheReadUsdPerMillion": 0.125,
			"cacheWriteUsdPerMillion": 0
		}
	}
}
```

---

## Two-track plan

| Track | What | When | Status |
|---|---|---|---|
| **Track 1 (NOW)** | Free VS Code extension | ~2 weeks | **Active build** |
| Track 2 (DEFERRED) | Hosted SaaS for team leads | Triggered by Track 1 traction | **Frozen, archived in `_track2-saas/`** |

Track 1 is the build target right now. Track 2 is the eventual revenue product, but its spec stays untouched until at least one of these is true:
- ≥ 1,000 weekly active extension users
- ≥ 5 unsolicited inbound messages from team leads
- ≥ 1 company requests a paid invoice

---

## Read in this order

1. **[`CLAUDE.md`](./CLAUDE.md)** — project contract for Claude Code. The kickoff file.
2. **[`HANDOVER.md`](./HANDOVER.md)** — strategic context, two-track plan, what's NOT being built.
3. **[`DECISIONS.md`](./DECISIONS.md)** — locked decisions register. Final, not re-litigated.
4. **[`SOLUTION.md`](./SOLUTION.md)** — autopilot-grade build spec for the VS Code extension. 25 sections covering manifest, parsers, storage, UI, milestones, Definition of Done.

**The authoritative document set is exactly these five files** (this README + the four above). The `_track2-saas/` folder contains archived SaaS spec — informational only, do not act on it during Track 1. Any other file is non-authoritative.

---

## Quick orientation

- **Brand:** Infoc (company) · INFOC ONE (platform family) · AIMeter (this product)
- **Marketplace publisher ID:** `infoc-one` · display name `INFOC ONE`
- **Marketplace extension ID:** `infoc-one.aimeter`
- **Repo:** `aimeter-infoc-one/`
- **Pricing:** Free forever in this track. No Pro tier. No payment logic.
- **Privacy:** All data stays on the developer's machine. Zero outbound HTTP except an optional, off-by-default update check.
- **Stack:** Vanilla TypeScript + esbuild + chokidar + zod. No backend, no telemetry, no framework in the webview.
- **Build time:** ~2 weeks across 5 milestones (plus Milestone 0 for namespace lock).

---

## Use with Claude Code in VS Code

```bash
mkdir aimeter-infoc-one && cd aimeter-infoc-one
git init
# Copy CLAUDE.md, HANDOVER.md, SOLUTION.md, DECISIONS.md, README.md into root
# Copy _track2-saas/ folder verbatim (do not edit)
# Open the folder in VS Code
# In Claude Code panel, send: "Read CLAUDE.md, then proceed."
```

Claude Code reads the contract, follows Phase 1 milestones in `SOLUTION.md` §21, and pauses for review at each milestone boundary. It will not touch `_track2-saas/` — that's archived for the future product.

---

## Tagline

*Meter every AI agent, in one place.*
