# Infoc One AIMeter — Handover

> Meter every AI agent, in one place. Built for the engineering team lead who has to justify a fast-growing AI bill.

This document hands the project off to whoever picks it up next — a co-founder, a contractor, a future-you, or a Claude Code session in a fresh repo. Read this before `SOLUTION.md`.

---

## Brand at a glance

- **Company:** Infoc
- **Product group:** Infoc One
- **This product:** AIMeter
- **Domain:** `infoc.one`
- **Wordmark:** `AIMeter` (camelCase, never AIMETER / Aimeter / AI Meter)
- **CLI binary:** `aimeter`
- **Tagline:** *Meter every AI agent, in one place.*
- **First-mention rule:** "Infoc One AIMeter" once per surface, then "AIMeter" thereafter.

---

## What this is, in two sentences

AIMeter is a hosted FinOps product for engineering teams using multiple AI coding agents (Claude Code, Codex CLI, Gemini CLI, Copilot, Cursor, Cline, Aider, and the next ten that emerge). It captures usage from each agent via a small CLI installed on developer machines, aggregates it in a hosted backend, and surfaces a single dashboard plus Slack digest for the team lead.

---

## Where it stands today

- **Stage:** pre-validation. No code shipped. No customers.
- **Decision pending:** the buyer test (Phase 0 in `SOLUTION.md`) before any MVP build.
- **Assets:** strategic discovery complete. Deliverables: 12-slide pitch deck, this handover, autopilot-grade `SOLUTION.md`. A throwaway VS Code-extension prototype exists but is **superseded** — see "Decisions made" §.
- **Visual identity:** deep navy `#0F172A`, teal `#0D9488`, amber `#F59E0B` for risk/warning. Type: Inter for product UI; the deck uses Trebuchet MS / Calibri as a working pair.

---

## How we got here (compressed)

The project started as a single-developer VS Code extension that would tail Claude Code, Codex CLI, and Copilot logs into one status-bar widget. A 7-stage strategic interrogation surfaced three things that changed the product:

1. **The dev is the wrong buyer.** Most developers don't pay their own AI bill — the company does. The pain lives one level up, with the team lead who has to justify a doubling-quarterly spend. A local-only tool on individual laptops doesn't serve that buyer.
2. **"Covers all agents" is a feature, not a wedge.** The defensible angle is being the *neutral* aggregator no provider can credibly be. Anthropic will not honestly track OpenAI usage; GitHub will not surface Claude spend.
3. **The agent landscape is bigger than three.** Realistic count: 15–20 agents teams might be running (Claude Code, Codex, Gemini CLI, Copilot, Cursor, Windsurf, Cline, Roo Code, Continue, Aider, Goose, OpenCode, Augment, Q Developer, Tabby, plus VS Code forks). Many are BYOK, so usage flows through the user's Anthropic/OpenAI account regardless of which front-end agent invoked it.

The reframe: **stop building a VS Code extension for individual developers. Build a hosted team product. The extension comes later as an acquisition channel.**

---

## Who it's for

| Persona | Pain | Budget | Buying signal |
|---|---|---|---|
| Solo dev (personal) | Mild | Self | Won't pay for this |
| Dev on company account | None | No | Won't even install |
| **Team lead, 5–50 eng** | **Acute** | **Their P&L** | **Primary buyer** |
| Eng director / VP | Acute | Yes | Secondary buyer, deeper deals |
| Finance / FinOps | Acute | Yes | Wants exports, won't use UI |

The product is shaped end-to-end for the team lead. Everything else is a downstream consequence.

---

## Decisions made

1. **Hosted SaaS, not local-only.** Local data on 12 laptops is the opposite of what a team lead needs.
2. **CLI agent over VS Code extension as the capture surface.** Editor-agnostic, OS-agnostic, works for users on Cursor / Windsurf / terminal too. VS Code extension is deferred to a later acquisition-channel phase.
3. **Paid from day one. No free tier in v1.** $99/seat/month team plan. Free tier dilutes the buyer signal we're trying to read in early validation.
4. **Phase the parser coverage.** Phase 1 = Claude Code + Codex CLI + Gemini CLI + account-level Anthropic + account-level OpenAI APIs. Phase 2 = Copilot + Cursor + Windsurf via billing APIs. Phase 3 = the BYOK extensions (Cline, Roo, Continue, Aider) that piggyback on Phase 1 provider accounts.
5. **Validate before building.** The buyer test in Phase 0 (`SOLUTION.md` §22) decides whether the full MVP gets built. Hard gate: 15 qualified emails + 3 booked discovery calls + 1 Stripe Checkout click in 14 days.
6. **The early prototype VS Code extension is dead.** The architecture (local JSONL store, status-bar widget, no team backend) doesn't fit the reframed product. Treat it as a reference for parser logic only.
7. **Domain is `infoc.one`.** The product group *is* the TLD. App at `app.infoc.one`, API at `api.infoc.one`, marketing at `infoc.one`.
8. **Product name landed on AIMeter.** After running the naming framework against five candidates (Datum, Meter, Trail, Spend, AIMeter), AIMeter won on directness, search-ownership, and immediate recognizability of category.

---

## What we are explicitly NOT building (and why)

- **No VS Code extension in v1.** Comes later as a free acquisition channel pointing to the SaaS.
- **No Copilot tracking in v1.** Per-developer attribution data isn't cleanly available from GitHub. Don't ship something that pretends to measure what we estimate.
- **No public parser plugin system in v1.** Communities form around projects that already have users. We'll write all parsers internally for the first year.
- **No free tier in v1.** Distorts the willingness-to-pay signal.
- **No SSO / SAML in v1.** Defer until enterprise inbound.
- **No Datadog / Grafana exporter in v1.** Defer until a paying customer asks.
- **No mobile app, ever (probably).** This is a desk product.

---

## Open risks (the ones that could kill it)

1. **Buyer-test fails.** ~60% probability per premortem. Mitigation: the test is the cheapest possible filter, run it before writing more code.
2. **Provider log schemas churn.** Claude Code's JSONL has shifted multiple times in the past year. Mitigation: parser-per-version, nightly fixture-based CI, alerts when format diverges.
3. **Providers ship native multi-agent tracking.** Anthropic could add cross-provider in their Console. Mitigation: lean into the *neutral aggregator* angle they cannot credibly take.
4. **Copilot data quality stays poor.** Mitigation: don't promise Copilot accuracy until we have OAuth-app-level access; lead with what we *can* measure precisely.
5. **GitHub billing API rate limits or locks down.** Mitigation: org-admin OAuth path, daily polling cadence, cache aggressively.

---

## Numbers worth remembering

- Sweet-spot customer: 5–50 person eng teams, $5k–100k/month AI spend.
- Pricing: $99/seat/month team plan. Annual pricing: defer the discount conversation until a customer asks.
- TAM rough estimate: ~50,000 such teams globally; capturing 1% at a $50k average ACV ≈ $25M ARR ceiling on this product alone. Long-game expansion is "FinOps for AI" beyond just coding agents.
- Validation gate: 15 qualified emails + 3 calls + 1 Stripe Checkout click in 14 days.
- MVP build budget if validation passes: 4 weeks to first paying customer.

---

## What to do next (in order)

1. **Run the Phase 0 buyer test.** Spec in `SOLUTION.md` §22. Two weeks, capped budget. Hard gate.
2. **If the gate passes:** start the MVP build per `SOLUTION.md` §23.
3. **If the gate fails:** kill or pivot. Possible pivots in order of preference:
   - Reposition for individual devs as a free CLI tool (different business — donations / sponsorship, not SaaS).
   - Reposition further upmarket as a FinOps add-on for Vantage / CloudZero buyers.
   - Sunset the project. Open-source the parsers as a gift to the ecosystem.

---

## References (in this folder)

- `SOLUTION.md` — full technical build spec, autopilot-grade. Phase 0 + Phase 1 with acceptance criteria.
- `CLAUDE.md` — project contract for Claude Code. Read first; points at HANDOVER then SOLUTION.
- `infoc-one-solution-deck.pptx` — 12-slide pitch deck. Still uses earlier "Infoc One" wordmark; regenerate when AIMeter visual identity is finalized.
- Strategic discovery transcript — the 7-stage interrogation that produced this reframe. Kept for posterity; do not re-litigate.

---

## Naming and IP — to lock down before launch

- [ ] Trademark check on "Infoc" and "AIMeter" (USPTO + WIPO + EUIPO at minimum)
- [ ] Domains: `infoc.one` (primary), `infoc.com` (defensive, redirect), `infoc.dev` (defensive), `aimeter.io` (defensive)
- [ ] GitHub org: `infoc`, repo `infoc/aimeter`
- [ ] npm scope: `@infoc` with `@infoc/aimeter-cli` reserved
- [ ] VS Code Marketplace publisher: `infoc`
- [ ] Open VSX publisher: `infoc`
- [ ] Slack app name: `AIMeter`
- [ ] LinkedIn company page: `Infoc`
- [ ] Email: `hello@infoc.one`, `support@infoc.one`, `security@infoc.one`

Claim the namespace squat-style even if launch is months away. Costs roughly $200; saves a six-figure rebrand.

---

*Last updated: 5 May 2026. Anyone editing this doc should bump this date and note what changed in a one-line changelog at the bottom.*

## Changelog

- **2026-05-05** — Renamed product to AIMeter. Domain locked to `infoc.one`. Naming convention recorded. References to `infoc.dev` removed from primary domain list (kept defensive only).
- **2026-05-05** — Initial handover written after strategic reframe from VS Code extension to hosted team product.
