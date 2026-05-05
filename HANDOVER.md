# INFOC ONE AIMeter — VS Code Extension Handover

> Meter every AI agent, in one place. A free VS Code extension. Built first; SaaS later if traction warrants.

This document hands the project off to whoever picks it up next — a co-founder, a contractor, a future-you, or a Claude Code session in a fresh repo. Read this before `SOLUTION.md`.

---

## Position

This is **Track 1** of a two-track plan:

- **Track 1 (NOW):** Free VS Code extension for individual developers. Local-only, private, free forever. Builds in ~2 weeks.
- **Track 2 (DEFERRED):** Hosted SaaS for engineering team leads at `aimeter.infoc.one`. Spec frozen and archived in `_track2-saas/`. Triggered only when Track 1 shows traction.

Track 1 is the funnel; Track 2 is the eventual revenue engine. Track 1 must be a real, complete, useful product on its own — not a pre-payment demo for the SaaS. If the SaaS never materialises, the extension still has lasting value to its users.

---

## Brand at a glance

- **Company:** Infoc (Infochola Solutions Pte Ltd)
- **Family:** INFOC ONE
- **Product:** AIMeter
- **Wordmark:** `AIMeter` (camelCase, never AIMETER / Aimeter / AI Meter)
- **Marketplace publisher ID:** `infoc-one` (used in extension URLs, cannot be renamed)
- **Marketplace publisher display name:** `INFOC ONE` (shown on listing, can be edited)
- **Marketplace extension ID:** `infoc-one.aimeter`
- **Repo:** `aimeter-infoc-one/`
- **Marketing page:** `aimeter.infoc.one`
- **Pricing:** **Free forever in this track. No Pro tier. No payment logic at all.**
- **Tagline:** *Meter every AI agent, in one place.*

---

## What this is, in two sentences

A free VS Code extension that gives the individual developer a single private view of their AI coding-agent token usage and estimated cost — across Claude Code, Codex CLI, and Gemini CLI — by reading local JSONL session logs without any data ever leaving the developer's machine. It's the simplest, most useful version of AIMeter we can ship in two weeks; everything else (team views, billing, reconciliation) is a future product, not a future feature.

---

## Who it's for (Track 1)

| Persona | Pain | Use of extension |
|---|---|---|
| **Solo developer using AI agents** | "I have no idea what I'm spending" | **Primary user.** Free utility, low friction, immediately useful. |
| Developer at a company | "Curious about my own usage" | Secondary — installs because it's free + private. |
| Team lead | "I need team-level visibility" | Not the user. Will see the extension and ask: *"Is there a team view?"* — that's our Track-2 trigger signal. |

The extension is **not** trying to monetise the solo dev. It's trying to (a) be a useful free tool that builds trust in the AIMeter brand, and (b) generate the demand signal that justifies Track 2.

---

## Why this order (Track 1 before Track 2)

The earlier strategic interrogation correctly identified that team leads pay the bill, not solo devs — so the SaaS for team leads is the eventual business. **But** building a multi-tenant SaaS (Keycloak / Temporal / OpenFGA / RLS / billing / reconciliation) before validating any user demand is a 6-week bet on a hypothesis.

The VS Code extension is a **2-week, ~$0 bet** that:
- Validates the "developers care about AI usage transparency" hypothesis
- Builds a user base that includes the team-lead persona organically
- Produces a credible product to point to when selling Track 2 later
- Keeps the AIMeter brand alive in market regardless of Track 2 timing
- Generates parser code that Track 2 will reuse verbatim

**This is not a downgrade from the SaaS plan.** It's the right first step that the SaaS plan implicitly assumed but skipped.

---

## Locked architectural decisions (Track 1)

1. **Single VS Code extension, nothing else.** No backend, no API, no auth, no SaaS, no Stripe, no telemetry, no cloud sync.
2. **Marketplace + Open VSX.** Both publishers from day one to cover Cursor / VSCodium / Gitpod users.
3. **Three Phase-1 parsers:** Claude Code, Codex CLI, Gemini CLI. Read JSONL session logs only. No reading workspace files, no reading editor buffers.
4. **Local-only storage.** VS Code's `globalStorageUri`. Append-only JSONL by month.
5. **Vanilla TypeScript everywhere.** No React in the webview. SVG charts hand-rolled. Tiny bundle.
6. **Bundled pricing catalog**, hard pre-publish gate that catalog is ≤ 30 days old.
7. **Cost is always "estimated."** Never "actual" or "matches billing."
8. **Free forever.** No Pro tier, no entitlement checks, no payment SDK, ever, in Track 1.
9. **MIT license for the extension** (cleanest Marketplace listing).
10. **No machine fingerprinting.** Local install ID is `crypto.randomUUID()`, never transmitted.

---

## What we are explicitly NOT building (Track 1)

- No backend, no SaaS, no `app.aimeter.infoc.one`, no API at `api.aimeter.infoc.one`. The marketing page is the only web surface.
- No Pro tier, no payments, no licensing logic.
- No telemetry. None. Not even anonymous opt-in install counts.
- No team / multi-user / multi-machine sync of event data (settings sync via VS Code is fine; event data stays local).
- No Slack, no email, no Discord, no notifications outside VS Code itself.
- No Copilot / Cursor / Windsurf parsers (no usable local logs).
- No Cline / Roo / Continue / Aider parsers in v1 (deferred to Track 1.5 if real user demand).
- No reconciliation against provider billing APIs (no network calls).
- No internationalisation.
- No dark patterns to push users toward a future SaaS.

---

## Open risks

1. **Marketplace approval lag.** First-time publisher review can take a few business days. Mitigation: submit on Day 12, not Day 13.
2. **Provider log schema churn.** Claude Code's JSONL has shifted before. Mitigation: per-version parser, fixture-based CI, parser falls back to "skip line + log warn" on unrecognised shape.
3. **Gemini CLI schema unknowns.** Mitigation: Milestone 3 starts by verifying current Gemini CLI log location and shape; if unstable, ship v0.1.0 with Claude Code + Codex only and add Gemini in v0.2.0.
4. **No-data path-resolution issues on Windows.** Mitigation: doctor command surfaces this clearly; first-run notification points to settings if nothing is found.
5. **Privacy promise vs reality drift.** Mitigation: integration test that intercepts all network calls and fails the build on any unexpected egress.
6. **Track-2 false start.** Risk that we trigger Track 2 too early on a soft signal. Mitigation: the trigger criteria in `SOLUTION.md` §22 are explicit thresholds, not vibes.

**Resolved by removal:** Grafana AGPL boundary, Keycloak / Temporal / OpenFGA operational complexity, Postgres RLS, billing adapter — all Track-2 concerns, none apply here.

---

## Numbers worth remembering

- **Build time:** ~2 weeks (5 milestones, ~3 days each, 1 dev)
- **Build cost:** essentially $0 — Marketplace publishing is free, Open VSX is free, no infra
- **Marketplace target Week 1:** ≥10 installs in first 48h
- **Track-2 trigger thresholds:** 1,000 WAU OR 5 inbound team-lead messages OR 1 paid-invoice request
- **Time to Track-2 trigger:** unknown — could be 4 weeks, could be never. Both outcomes are acceptable.

---

## What to do next (in order)

1. **Initialize repo `aimeter-infoc-one/`.** Push the four authoritative docs (`CLAUDE.md`, `HANDOVER.md`, `SOLUTION.md`, `DECISIONS.md`) and `README.md`.
2. **Open in VS Code** with Claude Code extension installed. Send the kickoff prompt (in `CLAUDE.md`).
3. **Provision in parallel** (this work happens in Milestone 0 of `SOLUTION.md` §21 — must complete before coding):
   - GitHub repo `infoc-one/aimeter-infoc-one` (private until v0.1.0 ships)
   - Microsoft Marketplace publisher: register publisher ID `infoc-one` at https://marketplace.visualstudio.com/manage. Set the publisher display name to `INFOC ONE`. **Publisher IDs cannot be renamed once created — confirm `infoc-one` is available before claiming.**
   - Azure DevOps Personal Access Token for `vsce publish` — create with `Marketplace > Manage` scope. Stored as repo secret `VSCE_PAT`.
   - Open VSX account and namespace `infoc-one` at https://open-vsx.org. PAT stored as `OVSX_PAT`.
   - Domain DNS at `aimeter.infoc.one` pointing to Cloudflare Pages or similar (marketing page can come Week 2; Marketplace listing works without it)
   - Email `hello@aimeter.infoc.one` (used for inbound team-lead messages — the Track-2 trigger signal)
4. **Confirm extension slot availability:** search Marketplace for `infoc-one.aimeter` — must return no result. If taken, pivot the extension name (e.g., `aimeter-tracker`); the publisher ID stays `infoc-one`.
5. **Verify pricing catalog** against current Anthropic / OpenAI / Google pricing pages — bump `verifiedAt` to today, update any rates that have moved since 5 May 2026.
6. **Plan Day 13 launch outreach:** Show HN draft, r/vscode post, r/ChatGPTCoding post, Twitter/X announcement. Prepare templates Week 2.

---

## Track-2 trigger and what to do then

Track 2 is **frozen** in `_track2-saas/`. Touch it only when one of these is true:

1. ≥1,000 weekly active extension users (Marketplace public count)
2. ≥5 unsolicited inbound messages from team leads asking for a team view
3. ≥1 company asking for a paid invoice for team-wide rollout

When triggered:
1. Re-read `_track2-saas/HANDOVER.md`, `_track2-saas/SOLUTION.md`, `_track2-saas/DECISIONS.md`
2. Move the SaaS spec out of archive into a new repo `infoc-one-aimeter-saas/`
3. Extract `parsers/` and `pricing/` from the extension into npm packages `@one/aimeter-parsers` and `@one/aimeter-pricing`
4. Begin SaaS Milestone 1 — but with real customer signal driving requirements, not assumptions

---

## References (in this folder — authoritative document set)

- `CLAUDE.md` — project contract for Claude Code. Read first.
- `HANDOVER.md` — this file.
- `SOLUTION.md` — autopilot-grade build spec, Track-1 v1.
- `DECISIONS.md` — locked decisions register.
- `README.md` — quick orientation.
- `_track2-saas/` — archived SaaS spec for the future product. **Do not act on these during Track 1.**

**Anything outside this list is non-authoritative.** Ignore.

---

## Naming and IP — to lock down before launch

- [ ] Trademark check on "Infoc" and "AIMeter" (Singapore IPOS + USPTO + WIPO)
- [ ] Domain `infoc.one` already held; confirm `aimeter.infoc.one` DNS configured
- [ ] Marketplace publisher ID `infoc-one` registered (display name `INFOC ONE`) and verified
- [ ] Open VSX namespace `infoc-one` claimed
- [ ] GitHub org `infoc-one` exists; repo `aimeter-infoc-one` created
- [ ] npm scope `@one` reserved (shared with INFOC ONE family — coordinate before publishing parser/pricing packages later)
- [ ] Email `hello@aimeter.infoc.one`, `support@aimeter.infoc.one`, `security@aimeter.infoc.one` working

---

*Last updated: 5 May 2026 — Track 1 v1*

## Changelog

- **2026-05-05 Track-1 v1.1** — Pre-build patches: Marketplace publisher ID corrected to `infoc-one`, display name `INFOC ONE`, extension ID `infoc-one.aimeter` (the previous `infoc.one.aimeter` was wrong per VS Code Marketplace conventions). Milestone 0 added as mandatory namespace-lock step before any coding. Mission language updated to "best-effort estimated."
- **2026-05-05 Track-1 v1** — Strategic re-positioning into two-track plan. Track 1 = free VS Code extension, Track 2 = hosted SaaS deferred. SaaS spec archived in `_track2-saas/`. Free forever, no Pro tier, no payment logic. Repo `aimeter-infoc-one/`.
