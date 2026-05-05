# CLAUDE.md

> Project contract. Read this before doing anything else.

## What this project is

Infoc One AIMeter — a hosted FinOps SaaS for engineering team leads to track AI coding-agent spend across multiple agents (Claude Code, Codex CLI, Gemini CLI, Copilot, Cursor, etc.). Brand: **AIMeter**. Domain: **infoc.one**. Pricing: $99/seat/month.

## Reading order

1. `HANDOVER.md` — context, decisions, who it's for, what's NOT being built, open risks. Read this first.
2. `SOLUTION.md` — autopilot-grade technical spec. Tech stack, schema, API contracts, milestones, Definition of Done. This is your build manual.

Anything that contradicts these two files defers to them. If something is unspecified, default to the closest pattern in `SOLUTION.md` and leave a comment marker (see "When stuck" below).

## Operating mode

This codebase is being built by an autonomous Claude Code session. You should:

- **Not ask the user clarifying questions during the build.** The user has explicitly opted into autopilot. Make a reasonable choice and proceed.
- **Mark every non-obvious decision** in code with `// [NEEDS-INPUT: <what's ambiguous>]` so the user can grep for them later.
- **Mark every assumption that overrode an `[ASSUMPTION: …]` tag in `SOLUTION.md`** with `// [ASSUMPTION-RESOLVED: <what you picked and why>]`.
- **Commit frequently** in Conventional Commits format. One commit per logical step, not one per session.
- **Run the quality gates** (`pnpm typecheck && pnpm lint && pnpm test && pnpm build`) before declaring any milestone complete.

## Build sequence

Begin at `SOLUTION.md` §22 (Phase 0 — Landing page). Build it end-to-end. Stop at the Phase 0 pass-gate; do not start Phase 1 without explicit instruction from the user.

If asked to skip Phase 0 and go straight to Phase 1, begin at `SOLUTION.md` §23 Milestone 1 and proceed sequentially through Milestone 5. Each milestone has acceptance criteria — verify them before moving on.

## Hard rules

These override anything else:

1. **Privacy.** Never read, log, or transmit source code, prompt text, or completion text. Parsers must drop these fields if present in upstream JSONL. This is the product's most important promise; violating it is a P0 bug.
2. **Secrets.** Never commit `.env.local`, API keys, tokens, or any secret value. Only `.env.example` with placeholders is committed.
3. **Migrations.** Never edit a committed migration file. Always create a new one via `pnpm db:generate`.
4. **Dependencies.** Never add a runtime dependency to a `package.json` that isn't listed in `SOLUTION.md` §3 without leaving a `// [NEEDS-INPUT: new runtime dep <name> for <reason>]` marker. Dev deps are fine.
5. **Branding.** Wordmark is `AIMeter` (camelCase, two-letter prefix). Never `AIMETER`, `Aimeter`, or `AI Meter`. CLI binary is `aimeter` lowercase. First mention per surface is "Infoc One AIMeter"; subsequent mentions are "AIMeter".
6. **Domain.** All URLs use `infoc.one`. Never `infoc.com` or `infoc.dev` in user-facing copy or code (those are defensive holdings).
7. **Strict TypeScript.** `strict: true`, `noUncheckedIndexedAccess: true`. No `any`. No `@ts-ignore` without an inline reason comment.
8. **Zod everything.** Every external input — API request body, query params, env vars, parser output, webhook payload — passes through a zod schema before being trusted.
9. **No `process.env.X` outside `lib/env.ts`.** Use the typed `env` export. ESLint enforces this.

## When stuck

If you cannot make progress without user input:

1. Leave a `// [NEEDS-INPUT: <one-line question>]` comment at the exact location.
2. Stub the function with a `throw new Error('NEEDS-INPUT: …')` if it's on a critical path, or a sensible default if not.
3. Continue with the next task. Do not block the build on one ambiguity.

At the end of each milestone, surface a "Needs input" summary listing every `[NEEDS-INPUT]` marker you left, sorted by criticality.

## Per-directory contracts

Once the repo is scaffolded, each directory below gets its own `CLAUDE.md` per `SOLUTION.md` §25:

- `apps/web/CLAUDE.md`
- `apps/cli/CLAUDE.md`
- `apps/slack-bot/CLAUDE.md`
- `packages/parsers/CLAUDE.md`
- `packages/db/CLAUDE.md`

When working inside one of those directories, that directory's `CLAUDE.md` is authoritative on top of this one.

## Definition of done (per milestone)

A milestone is done when **all** of the following are true:

- [ ] Acceptance criteria for that milestone in `SOLUTION.md` §23 are verified.
- [ ] `pnpm typecheck` exits 0.
- [ ] `pnpm lint` exits 0.
- [ ] `pnpm test` exits 0 with coverage thresholds met.
- [ ] `pnpm build` exits 0.
- [ ] All `[NEEDS-INPUT: …]` markers introduced in this milestone are listed in the milestone summary.
- [ ] Smoke checklist for that milestone (in `SOLUTION.md` §18) has been walked through.
- [ ] A commit on `main` (or feature branch ready to merge) reflects the work.

When all boxes are checked, post a one-paragraph summary to the user with: what shipped, what's blocked, what needs input.

---

*This file is the project's North Star. If you find yourself drifting from it, stop and re-read.*
