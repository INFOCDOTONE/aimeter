# Infoc One AIMeter

> Meter every AI agent, in one place.

This folder contains the planning and build documents for **AIMeter** (full name: Infoc One AIMeter), a hosted FinOps SaaS for engineering teams tracking AI coding-agent spend. Drop these into a fresh VS Code workspace, open the folder, point Claude Code at it.

## Read in this order

1. **[`CLAUDE.md`](./CLAUDE.md)** — project contract for Claude Code. The kickoff file. Read first if you're an AI agent; second if you're human.
2. **[`HANDOVER.md`](./HANDOVER.md)** — strategic context. What this is, who it's for, what's decided, what's NOT being built, open risks. Read this for the why.
3. **[`SOLUTION.md`](./SOLUTION.md)** — autopilot-grade technical spec. 27 sections covering pinned versions, full schema, API contracts, CLI spec, parser specs, milestones, Definition of Done. Read this for the how.

## Quick orientation

- **Brand:** Infoc (company) · One (product group) · AIMeter (this product)
- **Domain:** `infoc.one`
- **Stage:** pre-validation. No code shipped yet.
- **Next action:** run the Phase 0 buyer test described in `SOLUTION.md` §22.
- **Hard gate:** 15 qualified emails + 3 booked discovery calls + 1 Stripe Checkout click in 14 days. Below that, pivot or kill.

## Use with Claude Code in VS Code

```bash
mkdir aimeter && cd aimeter
git init
# Copy CLAUDE.md, HANDOVER.md, SOLUTION.md, and this README into the new repo
# Open the folder in VS Code
# In Claude Code panel, send: "Read CLAUDE.md, then proceed."
```

`CLAUDE.md` tells Claude Code to read `HANDOVER.md` first, then `SOLUTION.md`, then start at Phase 0 (§22). It encodes the autopilot operating rules — no clarifying questions, mark ambiguity with `[NEEDS-INPUT: …]` markers, run quality gates between milestones.

## Tagline

*Meter every AI agent, in one place.*
