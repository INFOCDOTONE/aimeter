# Changelog

## 0.1.12

- Replace remaining user-facing AIMeter labels with AI Meter across extension UI text and docs.

## 0.1.11

- Update extension display name usage to INFOC ONE AI Meter across metadata and docs.
- Include current extension updates for the next packaged release.

## 0.1.10

- Simplify extension metadata and README wording for marketplace upload compliance checks.
- Set homepage metadata to the GitHub repository URL.

## 0.1.9

- Add README inline product screenshot rendering with the tracked `media/screenshots/AIMeter Product screenshot.png` asset.
- Refresh release package metadata for the new extension build.

## 0.1.8

- Fix missing README hero asset rendering by ensuring the referenced hero image is shipped in `media/hero.png`.
- Update repository, bugs, discussions, disclaimer, and privacy links to `https://github.com/INFOCDOTONE/aimeter`.

## 0.1.7

- Treat GitHub Copilot usage API HTTP 404 responses as unsupported-access instead of generic errors, so AI Meter does not treat this account/permission limitation as an import failure.
- Add provider test coverage for unsupported-access status on HTTP 404.

## 0.1.6

- Improve GitHub Copilot import failure diagnostics so AI Meter surfaces actionable causes in the warning message (invalid/expired token, missing access, endpoint unavailable, malformed response, network/other runtime error).
- Add provider regression test coverage for HTTP 401 error messaging.

## 0.1.5

- Add daily local mirror CSV files at ~/.aimeter per agent with monthly archive rotation.
- Improve GitHub Copilot connect flow to reuse existing PAT with import/replace/disconnect actions.
- Show explicit warning notification when GitHub Copilot usage import fails.

## v0.1.0 - 2026-05-06

**Pilot release.**

This is the first public pilot release of INFOC ONE AI Meter. All cost figures are best-effort estimates, not actual bills. By installing or using this extension you agree to the terms in `DISCLAIMER.md` and `PRIVACY.md`.

### Features

- Local tracking of token usage from Claude Code, Codex CLI, and Gemini CLI.
- Optional GitHub Copilot usage import using a user-provided PAT stored in VS Code SecretStorage.
- Sidebar dashboard with Today, 7-day, and 30-day windows.
- Status bar summary for estimated cost and token usage.
- CSV export with disclaimer header comments.
- Doctor diagnostics for parser paths, storage, GitHub Copilot connection, pricing freshness, and estimate-only cost language.

### Disclaimer changes

- Added root `DISCLAIMER.md` for pilot terms, no-warranty language, estimate-only cost figures, no-affiliation notice, Singapore governing law, and liability cap.

## 0.1.4

- Add opt-in GitHub Copilot usage import using a user-provided PAT stored in VS Code SecretStorage.
- Add Connect Copilot dashboard and Doctor actions, plus updated privacy documentation for provider usage imports.

## 0.1.3

- Backfill Codex CLI usage after parser offset fixes by versioning watcher offsets per agent.
- Keep Claude Code, Codex CLI, and Gemini CLI visible in the dashboard agent meter, including no-usage states.

## 0.1.2

- Add Codex CLI envelope token-count parsing for newer local JSONL session logs.
- Make refresh and clear-data flows rescan existing local usage logs.

## 0.1.1

- Improve AI Meter cost accuracy and billing-basis display for API-metered, subscription-included, and unknown usage.
- Document GitHub Copilot local metering limitations for Track 1.

## 0.1.0

- Initial Track 1 extension skeleton.
