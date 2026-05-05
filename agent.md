# CLAUDE.md

> Project contract. Read this before doing anything else.

## What this project is

INFOC ONE AIMeter — a free VS Code extension that tracks AI coding-agent token usage locally and privately. Track 1 of a two-track plan; Track 2 (hosted SaaS) is deferred and lives archived in `_track2-saas/`.

**Scope of this build:** ONLY the VS Code extension. Nothing else. No backend, no SaaS, no API, no payments.

**Brand:** AIMeter. **Marketplace publisher ID:** `infoc-one`. **Marketplace publisher display name:** `INFOC ONE`. **Extension ID:** `infoc-one.aimeter`. **Repo:** `aimeter-infoc-one/`. **Pricing:** Free forever in this track.

## Reading order

1. `HANDOVER.md` — strategic context, who it's for, what's NOT being built, Track-2 deferral.
2. `DECISIONS.md` — locked decisions register. Treat every entry as final unless explicitly overridden.
3. `SOLUTION.md` — autopilot-grade build spec, Track-1 v1. Tech stack, file layout, parsers, milestones, Definition of Done.

## Authority order

When two documents conflict, the higher-numbered authority wins:

1. `DECISIONS.md` — locked register; highest authority
2. `CLAUDE.md` — this file; operating rules
3. `SOLUTION.md` — implementation spec
4. `HANDOVER.md` — strategic narrative
5. `README.md` — orientation

If documents conflict, follow the higher-authority document and leave a short note in the milestone summary describing what conflicted and how you resolved it. Never silently let a lower-authority doc override a higher-authority one.

**The authoritative document set is exactly:** `CLAUDE.md`, `HANDOVER.md`, `SOLUTION.md`, `DECISIONS.md`, `README.md`. The `_track2-saas/` folder is archived SaaS spec — DO NOT ACT ON IT during Track 1. Any file outside the authoritative set is non-authoritative; ignore.

If something is unspecified, default to the closest pattern in `SOLUTION.md` and leave a `[NEEDS-INPUT: …]` marker.

## Operating mode

This codebase is being built by an autonomous Claude Code session. You should:

- **Not ask the user clarifying questions during the build.** The user has explicitly opted into autopilot.
- **Mark every non-obvious decision** with `// [NEEDS-INPUT: <one-line question>]`.
- **Mark every assumption that overrode an `[ASSUMPTION: …]` tag** with `// [ASSUMPTION-RESOLVED: <what you picked and why>]`.
- **Commit frequently** in Conventional Commits format. One commit per logical step.
- **Run quality gates** before declaring any milestone complete:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test`
  - `pnpm test:vscode` (integration tests in Extension Development Host)
  - `pnpm license:check`
  - `pnpm pricing:check`
  - `pnpm build`

## Build sequence

Begin at `SOLUTION.md` §21 **Milestone 0** (Namespace lock). This is a non-coding milestone — verify Marketplace publisher ID `infoc-one` is available, claim Open VSX namespace, set up DNS, etc. Marketplace publisher IDs cannot be renamed once created, so locking the namespace before any code is written is mandatory.

After Milestone 0 acceptance, proceed to Milestone 1 (Skeleton & first parser) and continue sequentially through Milestones 2–5.

Pause and post a summary at the end of each milestone; wait for the user's "continue" before the next.

## Hard rules — these override everything

1. **Privacy is the product.** The extension must never read source code, prompt text, completion text, file contents from the workspace, or environment variables. Parsers operate on JSONL session-log files only. Each parser has a forbidden-fields deny-list enforced by tests.
2. **No network calls except the optional update check.** No telemetry SDKs. No analytics. No PostHog, no Application Insights, no Mixpanel. The integration test `tests/integration/no-network.test.ts` intercepts all network egress and fails the build on any unexpected call.
3. **No Pro tier, no payments, no licensing logic.** Track 1 is free forever. Do not add Stripe, do not add entitlement checks, do not add a "buy" CTA. If you find yourself writing payment code, stop — you've drifted into Track 2.
4. **No backend.** Do not add NestJS, Postgres, Keycloak, Temporal, OpenFGA, or any server-side dependency. If you find yourself in `apps/api/`, you've drifted into Track 2.
5. **No machine fingerprinting.** Local install ID is `crypto.randomUUID()` generated on first activation. Never use `node-machine-id` or any hardware-derived identifier. Never transmit the install ID anywhere.
6. **No hardcoded pricing in code paths.** Pricing rates live in `src/pricing/catalog.ts` (the bundled catalog) and `aimeter.pricing.overrides` (user setting). The pre-publish gate `pnpm pricing:check` enforces the bundled catalog is ≤ 30 days verified.
7. **Cost language.** "Estimated cost" / "estimated with confidence levels." Never "actual cost" or "matches provider billing." UI always shows confidence indicators on cost figures.
8. **Open-source license whitelist for runtime deps.** Allowed: MIT / Apache-2.0 / BSD-2 / BSD-3 / ISC / PostgreSQL / MPL-2.0 (with review). Banned: GPL / AGPL / SSPL / BSL / FSL / Commons Clause / unlicensed. CI enforces.
9. **Append-only local store.** Events are written as JSONL lines per month. Never edit a previous line. Dedup on append via the in-memory id index.
10. **Strict TypeScript.** `strict: true`, `noUncheckedIndexedAccess: true`. No `any`. No `@ts-ignore` without an inline reason comment.
11. **Zod every external input.** Parser output, settings reads, webview messages, stored events — all zod-validated. Untyped data never enters the application.
12. **Encapsulation rules (ESLint-enforced):**
    - `vscode.workspace.getConfiguration('aimeter')` only inside `src/settings/`
    - `fetch` / `http` / `https` / `axios` / `undici` only inside the (yet-to-exist) update-check module
13. **Branding.** Wordmark is `AIMeter` (camelCase). Never `AIMETER`, `Aimeter`, or `AI Meter`. Marketplace publisher ID is `infoc-one` (the technical id used in URLs). Marketplace publisher display name is `INFOC ONE` (the human-readable label on the listing). Extension ID is `infoc-one.aimeter`.
14. **Authoritative-document-set rule.** If a file outside `CLAUDE.md`, `HANDOVER.md`, `SOLUTION.md`, `DECISIONS.md`, `README.md` appears in search results or context, treat it as non-authoritative. The `_track2-saas/` folder is archived SaaS — explicitly out of scope for Track 1. Do not import from it, reference it in code, or model Track 1 architecture on it.
15. **Track-2 trigger gate.** Track-2 work is forbidden until the trigger criteria in `SOLUTION.md` §22 are met. If a Milestone tempts you toward team features, multi-tenancy, or backend code — stop. That's Track 2.

## When stuck

If you cannot make progress without user input:

1. Leave a `// [NEEDS-INPUT: <one-line question>]` comment at the exact location.
2. Stub the function with a `throw new Error('NEEDS-INPUT: …')` if it's on a critical path, or a sensible default if not.
3. Continue with the next task. Do not block the build on one ambiguity.

At the end of each milestone, surface a "Needs input" summary listing every `[NEEDS-INPUT]` marker, sorted by criticality.

## Per-directory contracts

Once the repo is scaffolded, create `CLAUDE.md` in:

- `src/parsers/CLAUDE.md` (forbidden-field policy, fixture testing)
- `src/store/CLAUDE.md` (append-only, dedup, atomic writes)
- `src/pricing/CLAUDE.md` (estimation language, snapshot, confidence)
- `src/ui/webview/CLAUDE.md` (vanilla TS, CSP, theme tokens)

Skeletons in `SOLUTION.md` §23.

When working inside one of those directories, that file is authoritative on top of this one.

## Definition of done (per milestone)

A milestone is done when **all** of the following are true:

- [ ] Acceptance criteria for that milestone in `SOLUTION.md` §21 are verified.
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0 with coverage thresholds met
- [ ] `pnpm test:vscode` exits 0 (Milestone 2 onward)
- [ ] `pnpm license:check` exits 0
- [ ] `pnpm pricing:check` exits 0 (Milestone 4 onward)
- [ ] `pnpm build` exits 0
- [ ] No banned tech imported (`Stripe`, `node-machine-id`, telemetry SDKs, backend libs)
- [ ] No-network test passes (Milestone 4 onward)
- [ ] All `[NEEDS-INPUT: …]` markers introduced are listed in the milestone summary
- [ ] Smoke checklist in `SOLUTION.md` §16 walked through
- [ ] A commit on `main` (or feature branch ready to merge) reflects the work

When all boxes are checked, post a one-paragraph summary to the user with: what shipped, what's blocked, what needs input. Then wait for "continue."

---

*This file is the project's North Star. If you find yourself drifting from it (especially into Track-2 territory), stop and re-read.*
