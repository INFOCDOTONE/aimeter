# Infoc One AIMeter — Solution Spec

> **Autopilot-grade build document.** Hand this to Claude Code in a fresh VS Code workspace alongside `HANDOVER.md`. No further questions should be required to begin Phase 0 or Phase 1 work. Every assumption is flagged `[ASSUMPTION: …]` — override before running.

**Brand:** Infoc (company) · One (product group) · AIMeter (this product)
**Domain:** `infoc.one`
**Tagline:** *Meter every AI agent, in one place.*

---

## Table of contents

1. [Mission, scope, and out-of-scope](#1-mission-scope-and-out-of-scope)
2. [Conventions and naming](#2-conventions-and-naming)
3. [Tech stack with pinned versions](#3-tech-stack-with-pinned-versions)
4. [Repository layout](#4-repository-layout)
5. [Environment variables](#5-environment-variables)
6. [Database schema](#6-database-schema)
7. [API contracts](#7-api-contracts)
8. [Authentication](#8-authentication)
9. [CLI agent specification](#9-cli-agent-specification)
10. [Parser specifications](#10-parser-specifications)
11. [Pricing table](#11-pricing-table)
12. [Web app specification](#12-web-app-specification)
13. [Background jobs (Inngest)](#13-background-jobs-inngest)
14. [Slack integration](#14-slack-integration)
15. [Stripe integration](#15-stripe-integration)
16. [Error handling](#16-error-handling)
17. [Logging](#17-logging)
18. [Testing](#18-testing)
19. [Build, run, dev, deploy commands](#19-build-run-dev-deploy-commands)
20. [Lint and format](#20-lint-and-format)
21. [CI/CD](#21-cicd)
22. [Phase 0 — Landing page (Week 1–2)](#22-phase-0--landing-page-week-12)
23. [Phase 1 — MVP build (Week 3–6)](#23-phase-1--mvp-build-week-36)
24. [Phase 2 — Roadmap](#24-phase-2--roadmap)
25. [CLAUDE.md scaffolds](#25-claudemd-scaffolds)
26. [Definition of done](#26-definition-of-done)
27. [Assumptions index](#27-assumptions-index)

---

## 1. Mission, scope, and out-of-scope

### Mission
A hosted FinOps dashboard for engineering team leads to track and attribute AI coding-agent spend across multiple agents (Claude Code, OpenAI Codex CLI, Google Gemini CLI, GitHub Copilot, Cursor, and others), with daily Slack digests, anomaly alerts, and CSV export.

### In scope (Phase 1 MVP)
- Web app: marketing site at `infoc.one`, app at `app.infoc.one`
- CLI agent (`@infoc/aimeter-cli`) installed per developer
- Hosted backend (Next.js API routes on Vercel + Postgres on Neon)
- Three Phase-1 parsers: Claude Code, Codex CLI, Gemini CLI
- Two account-level pulls: Anthropic API, OpenAI API (covers BYOK extensions)
- Per-org dashboard with per-user, per-agent, per-model, per-day breakdowns
- Slack OAuth + daily digest + anomaly alert
- Stripe Checkout + Customer Portal at $99/seat/month
- CSV export
- Email transactional via Resend

### Explicitly out of scope (Phase 1)
- VS Code extension (Phase 2 acquisition channel)
- Copilot tracking (Phase 2 — needs OAuth-app access)
- Cursor / Windsurf parsers (Phase 2)
- BYOK individual-agent parsers — Cline, Roo, Continue, Aider (Phase 2; covered indirectly via account-level pulls)
- Free tier, trial extensions beyond 14 days, custom plans
- SSO / SAML
- Datadog / Grafana / OTel exporter
- Multi-currency (USD only)
- Multi-org users (one user belongs to one org via Clerk Org)
- Mobile app
- Self-hosted / on-prem deployment
- Internationalization (English only)
- White-labeling
- Custom domains for customer dashboards

---

## 2. Conventions and naming

| Element | Convention | Example |
|---|---|---|
| File names | kebab-case | `usage-events.ts` |
| Directories | kebab-case | `apps/web/app/(app)/dashboard` |
| TypeScript types | PascalCase | `UsageEvent` |
| Functions, variables | camelCase | `aggregateByDay` |
| Constants | SCREAMING_SNAKE | `DEFAULT_PRICING` |
| DB tables | snake_case plural | `usage_events` |
| DB columns | snake_case | `cache_read_tokens` |
| URL routes | kebab-case | `/api/cli-auth` |
| Env vars | SCREAMING_SNAKE | `DATABASE_URL` |
| npm package names | scoped, kebab | `@infoc/aimeter-cli` |
| Branding in copy | "Infoc One AIMeter" first mention; "AIMeter" thereafter | |
| CLI binary | `aimeter` | `aimeter init` |

**Wordmark capitalization:** `AIMeter` (camelCase, two-letter prefix). Never `AIMETER`, `Aimeter`, or `AI Meter`.

**Commit format:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, etc.).

**Branch naming:** `feat/<short-desc>`, `fix/<short-desc>`. PRs squash-merged into `main`.

---

## 3. Tech stack with pinned versions

> `[ASSUMPTION: latest-stable as of 5 May 2026. Bump to current latest if newer compatible versions exist when you start. Pin in package.json — no caret ranges for runtime deps in the API/CLI.]`

### Runtime
- **Node.js**: `22.11.0` LTS (use `.nvmrc`)
- **pnpm**: `9.15.0` (use `packageManager` field in root package.json)
- **TypeScript**: `5.7.2` (strict mode, `noUncheckedIndexedAccess: true`)

### Web app (`apps/web`)
- `next@15.1.4`
- `react@19.0.0`, `react-dom@19.0.0`
- `@clerk/nextjs@6.10.0`
- `drizzle-orm@0.38.3`, `drizzle-kit@0.30.1` (devDep)
- `postgres@3.4.5` (driver)
- `stripe@17.5.0`
- `resend@4.0.1`
- `inngest@3.27.0`
- `@sentry/nextjs@8.47.0`
- `zod@3.24.1`
- `tailwindcss@4.0.0`, `@tailwindcss/postcss@4.0.0`
- `lucide-react@0.469.0` (icons)
- shadcn/ui (copied into `apps/web/components/ui/`, not a dep)
- `recharts@2.15.0`
- `date-fns@4.1.0`
- `pino@9.5.0`, `pino-pretty@13.0.0` (dev)

### CLI (`apps/cli`)
- `commander@12.1.0`
- `chalk@5.4.1`
- `ora@8.1.1`
- `chokidar@4.0.3`
- `zod@3.24.1`
- `undici@7.2.0`
- `node-machine-id@1.1.12`

### Slack worker (`apps/slack-bot`)
- `@slack/bolt@4.2.0`

### Dev tooling
- `vitest@2.1.8`, `@vitest/coverage-v8@2.1.8`
- `eslint@9.17.0` flat config + `@typescript-eslint/eslint-plugin@8.19.0`
- `prettier@3.4.2`, `prettier-plugin-tailwindcss@0.6.9`
- `tsx@4.19.2`
- `husky@9.1.7`, `lint-staged@15.3.0`

### Infra
- **Vercel** — web app + API routes
- **Neon** — Postgres 16, branch-per-PR
- **Inngest Cloud** — background jobs
- **Sentry** — error tracking
- **Axiom** `[ASSUMPTION]` — log aggregation; free tier covers MVP
- **npm** — CLI distribution as `@infoc/aimeter-cli`

---

## 4. Repository layout

```
aimeter/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── release-cli.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug.md
│   │   └── feature.md
│   └── pull_request_template.md
├── .vscode/
│   ├── settings.json
│   └── extensions.json
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── (marketing)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── pricing/page.tsx
│   │   │   │   ├── privacy/page.tsx
│   │   │   │   ├── terms/page.tsx
│   │   │   │   └── docs/[...slug]/page.tsx
│   │   │   ├── (app)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── users/page.tsx
│   │   │   │   ├── settings/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── billing/page.tsx
│   │   │   │   │   ├── slack/page.tsx
│   │   │   │   │   ├── api-keys/page.tsx
│   │   │   │   │   ├── alerts/page.tsx
│   │   │   │   │   └── pricing-overrides/page.tsx
│   │   │   │   └── onboarding/page.tsx
│   │   │   ├── api/
│   │   │   │   ├── ingest/route.ts
│   │   │   │   ├── cli/
│   │   │   │   │   ├── auth/init/route.ts
│   │   │   │   │   ├── auth/exchange/route.ts
│   │   │   │   │   └── keys/revoke/route.ts
│   │   │   │   ├── orgs/[orgId]/
│   │   │   │   │   ├── usage/route.ts
│   │   │   │   │   ├── users/route.ts
│   │   │   │   │   └── export.csv/route.ts
│   │   │   │   ├── webhooks/
│   │   │   │   │   ├── stripe/route.ts
│   │   │   │   │   ├── clerk/route.ts
│   │   │   │   │   └── slack/route.ts
│   │   │   │   ├── slack/
│   │   │   │   │   ├── install/route.ts
│   │   │   │   │   └── oauth-callback/route.ts
│   │   │   │   ├── inngest/route.ts
│   │   │   │   ├── waitlist/route.ts
│   │   │   │   └── health/route.ts
│   │   │   ├── cli-auth/page.tsx
│   │   │   ├── globals.css
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn primitives
│   │   │   ├── marketing/
│   │   │   ├── dashboard/
│   │   │   └── settings/
│   │   ├── lib/
│   │   │   ├── auth.ts
│   │   │   ├── api.ts
│   │   │   ├── stripe.ts
│   │   │   ├── slack.ts
│   │   │   ├── email.ts
│   │   │   ├── logger.ts
│   │   │   └── env.ts
│   │   ├── inngest/
│   │   │   ├── client.ts
│   │   │   └── functions/
│   │   │       ├── daily-rollup.ts
│   │   │       ├── daily-digest.ts
│   │   │       ├── anomaly-check.ts
│   │   │       ├── stripe-sync.ts
│   │   │       └── clerk-sync.ts
│   │   ├── middleware.ts
│   │   ├── next.config.mjs
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.mjs
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   ├── CLAUDE.md
│   │   └── .env.example
│   │
│   ├── cli/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── commands/
│   │   │   │   ├── init.ts
│   │   │   │   ├── start.ts
│   │   │   │   ├── stop.ts
│   │   │   │   ├── status.ts
│   │   │   │   ├── logout.ts
│   │   │   │   └── doctor.ts
│   │   │   ├── auth.ts
│   │   │   ├── config.ts
│   │   │   ├── watcher.ts
│   │   │   ├── pusher.ts
│   │   │   ├── parsers/             # Re-exports from @infoc/parsers
│   │   │   ├── logger.ts
│   │   │   └── version.ts
│   │   ├── bin/aimeter.js
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   ├── CLAUDE.md
│   │   └── README.md
│   │
│   └── slack-bot/
│       ├── src/
│       │   ├── digest.ts
│       │   ├── alerts.ts
│       │   ├── messages.ts
│       │   └── client.ts
│       ├── package.json
│       └── CLAUDE.md
│
├── packages/
│   ├── parsers/
│   │   ├── src/
│   │   │   ├── base.ts
│   │   │   ├── claude-code.ts
│   │   │   ├── codex-cli.ts
│   │   │   ├── gemini-cli.ts
│   │   │   ├── anthropic-api.ts
│   │   │   ├── openai-api.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── fixtures/
│   │   │   ├── claude-code/
│   │   │   ├── codex-cli/
│   │   │   └── gemini-cli/
│   │   ├── tests/
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── CLAUDE.md
│   │
│   ├── pricing/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── models.ts
│   │   │   └── compute.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   └── CLAUDE.md
│   │
│   ├── db/
│   │   ├── src/
│   │   │   ├── schema.ts
│   │   │   ├── client.ts
│   │   │   ├── queries/
│   │   │   │   ├── usage.ts
│   │   │   │   ├── orgs.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── api-keys.ts
│   │   │   │   └── alerts.ts
│   │   │   └── index.ts
│   │   ├── migrations/              # generated by drizzle-kit
│   │   ├── drizzle.config.ts
│   │   ├── package.json
│   │   └── CLAUDE.md
│   │
│   └── shared/
│       ├── src/
│       │   ├── schemas/
│       │   ├── time.ts
│       │   └── index.ts
│       └── package.json
│
├── tools/
│   ├── seed.ts
│   └── reset-db.ts
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── eslint.config.js
├── prettier.config.mjs
├── .gitignore
├── .nvmrc
├── .editorconfig
├── README.md
├── HANDOVER.md
├── SOLUTION.md
├── CLAUDE.md
└── LICENSE                          # [ASSUMPTION: proprietary, not OSS in v1]
```

---

## 5. Environment variables

### `.env.example` (commit this; never commit `.env.local`)

```bash
# ───────── App ─────────
NODE_ENV=development
LOG_LEVEL=debug
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MARKETING_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000

# ───────── Database (Neon) ─────────
DATABASE_URL=postgres://user:pass@localhost:5432/aimeter

# ───────── Clerk ─────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# ───────── Stripe ─────────
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID_TEAM_SEAT_MONTHLY=price_xxx
STRIPE_PRICE_ID_TEAM_SEAT_ANNUAL=price_xxx
STRIPE_PORTAL_CONFIGURATION_ID=bpc_xxx

# ───────── Resend ─────────
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL="AIMeter <hello@infoc.one>"
RESEND_REPLY_TO=support@infoc.one

# ───────── Slack ─────────
SLACK_CLIENT_ID=xxxxxxxxxx.xxxxxxxxxx
SLACK_CLIENT_SECRET=xxx
SLACK_SIGNING_SECRET=xxx
SLACK_STATE_SECRET=randomly-generated-32-byte-hex

# ───────── Inngest ─────────
INNGEST_EVENT_KEY=xxx
INNGEST_SIGNING_KEY=xxx

# ───────── Sentry ─────────
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx                # CI only
SENTRY_ORG=infoc
SENTRY_PROJECT=aimeter-web

# ───────── Axiom (logs) ─────────
AXIOM_TOKEN=xaat-xxx
AXIOM_DATASET=aimeter-prod

# ───────── Internal ─────────
CRON_SECRET=randomly-generated-32-byte-hex
TOKEN_ENCRYPTION_KEY=randomly-generated-32-byte-hex   # AES-256-GCM key for Slack tokens
```

### CLI config (lives at `~/.infoc-aimeter/config.json`, mode `0600`)

```json
{
  "apiUrl": "https://api.infoc.one",
  "apiKey": "aimeter_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "deviceLabel": "MacBook Pro - Sarah",
  "userId": "user_xxx",
  "orgId": "org_xxx",
  "watchPaths": {
    "claudeCode": ["~/.claude/projects"],
    "codexCli":   ["~/.codex/sessions"],
    "geminiCli":  ["~/.gemini/sessions"]
  }
}
```

CLI exits with error if file perms are looser than `0600`.

### Validated env loader

`apps/web/lib/env.ts` parses `process.env` once on boot via zod and re-exports a typed `env`. **No bare `process.env.X` access elsewhere in the codebase.** ESLint rule enforces this.

```ts
// apps/web/lib/env.ts
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string().startsWith('sk_'),
  CLERK_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_PRICE_ID_TEAM_SEAT_MONTHLY: z.string().startsWith('price_'),
  RESEND_API_KEY: z.string().startsWith('re_'),
  SLACK_CLIENT_ID: z.string(),
  SLACK_CLIENT_SECRET: z.string(),
  SLACK_SIGNING_SECRET: z.string(),
  SLACK_STATE_SECRET: z.string().min(32),
  INNGEST_EVENT_KEY: z.string(),
  INNGEST_SIGNING_KEY: z.string(),
  SENTRY_DSN: z.string().url().optional(),
  AXIOM_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().min(32),
  TOKEN_ENCRYPTION_KEY: z.string().length(64),       // 32 bytes hex
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_MARKETING_URL: z.string().url(),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
```

---

## 6. Database schema

### Drizzle schema (`packages/db/src/schema.ts`) — source of truth

```ts
import {
  pgTable, pgEnum, uuid, text, timestamp, integer, bigint,
  numeric, boolean, date, primaryKey, index,
} from 'drizzle-orm/pg-core';

export const planEnum = pgEnum('plan', ['trial', 'team_monthly', 'team_annual', 'paused', 'cancelled']);
export const roleEnum = pgEnum('role', ['owner', 'admin', 'member']);
export const agentEnum = pgEnum('agent', [
  'claude-code', 'codex-cli', 'gemini-cli',
  'anthropic-api', 'openai-api',
  'copilot', 'cursor', 'cline', 'aider', 'unknown',
]);
export const alertTypeEnum = pgEnum('alert_type', ['anomaly', 'budget_daily', 'budget_monthly']);
export const alertChannelEnum = pgEnum('alert_channel', ['slack', 'email']);

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkOrgId: text('clerk_org_id').notNull().unique(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: planEnum('plan').notNull().default('trial'),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  seatCount: integer('seat_count').notNull().default(0),
  timezone: text('timezone').notNull().default('UTC'),
  digestHour: integer('digest_hour').notNull().default(9),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ slugIdx: index('orgs_slug_idx').on(t.slug) }));

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  role: roleEnum('role').notNull().default('member'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ orgEmailIdx: index('users_org_email_idx').on(t.orgId, t.email) }));

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  keyHash: text('key_hash').notNull().unique(),
  keyPrefix: text('key_prefix').notNull(),
  label: text('label'),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ orgIdx: index('api_keys_org_idx').on(t.orgId) }));

export const cliAuthCodes = pgTable('cli_auth_codes', {
  deviceCode: text('device_code').primaryKey(),
  userCode: text('user_code').notNull(),
  deviceLabel: text('device_label').notNull(),
  status: text('status').notNull().default('pending'),  // pending | authorized | expired
  authorizedUserId: uuid('authorized_user_id').references(() => users.id),
  authorizedOrgId: uuid('authorized_org_id').references(() => organizations.id),
  apiKeyId: uuid('api_key_id').references(() => apiKeys.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const usageEvents = pgTable('usage_events', {
  id: text('id').primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  agent: agentEnum('agent').notNull(),
  model: text('model').notNull(),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  cacheReadTokens: integer('cache_read_tokens').notNull().default(0),
  cacheWriteTokens: integer('cache_write_tokens').notNull().default(0),
  costUsd: numeric('cost_usd', { precision: 12, scale: 6 }).notNull().default('0'),
  project: text('project'),
  sessionId: text('session_id'),
  ts: timestamp('ts', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  orgTsIdx: index('usage_org_ts_idx').on(t.orgId, t.ts),
  userTsIdx: index('usage_user_ts_idx').on(t.userId, t.ts),
  orgAgentTsIdx: index('usage_org_agent_ts_idx').on(t.orgId, t.agent, t.ts),
}));

export const dailyRollups = pgTable('daily_rollups', {
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  agent: agentEnum('agent').notNull(),
  model: text('model').notNull(),
  date: date('date').notNull(),
  inputTokens: bigint('input_tokens', { mode: 'number' }).notNull().default(0),
  outputTokens: bigint('output_tokens', { mode: 'number' }).notNull().default(0),
  cacheReadTokens: bigint('cache_read_tokens', { mode: 'number' }).notNull().default(0),
  cacheWriteTokens: bigint('cache_write_tokens', { mode: 'number' }).notNull().default(0),
  costUsd: numeric('cost_usd', { precision: 14, scale: 6 }).notNull().default('0'),
  events: integer('events').notNull().default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.orgId, t.userId, t.agent, t.model, t.date] }),
  orgDateIdx: index('rollups_org_date_idx').on(t.orgId, t.date),
}));

export const alerts = pgTable('alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  type: alertTypeEnum('type').notNull(),
  threshold: numeric('threshold', { precision: 12, scale: 4 }),
  channel: alertChannelEnum('channel').notNull(),
  channelTarget: text('channel_target').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  lastFiredAt: timestamp('last_fired_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const slackInstallations = pgTable('slack_installations', {
  orgId: uuid('org_id').primaryKey().references(() => organizations.id, { onDelete: 'cascade' }),
  teamId: text('team_id').notNull(),
  teamName: text('team_name').notNull(),
  botTokenEncrypted: text('bot_token_encrypted').notNull(),
  botUserId: text('bot_user_id').notNull(),
  defaultChannelId: text('default_channel_id'),
  installedAt: timestamp('installed_at', { withTimezone: true }).notNull().defaultNow(),
});

export const pricingOverrides = pgTable('pricing_overrides', {
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  model: text('model').notNull(),
  inputPerMillion: numeric('input_per_million', { precision: 10, scale: 4 }),
  outputPerMillion: numeric('output_per_million', { precision: 10, scale: 4 }),
  cacheReadPerMillion: numeric('cache_read_per_million', { precision: 10, scale: 4 }),
  cacheWritePerMillion: numeric('cache_write_per_million', { precision: 10, scale: 4 }),
}, (t) => ({ pk: primaryKey({ columns: [t.orgId, t.model] }) }));

export const waitlist = pgTable('waitlist', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  source: text('source'),
  utm: text('utm'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### Migration policy
- All schema changes via `pnpm db:generate` then `pnpm db:migrate`.
- **Never edit a committed migration file.** Create a new one.
- Production migrations run from CI on `main`, after deploy succeeds.

### Seed data (`tools/seed.ts`)
- Creates 1 org "Acme Eng" (`acme-eng`), 5 users, 14 days of usage events spanning all five Phase-1 agents.
- Idempotent: safe to run multiple times.
- Run via `pnpm seed`.

---

## 7. API contracts

All API routes live in `apps/web/app/api/`. JSON only. UTC timestamps in ISO 8601.

### Common error envelope

```ts
type ApiError = {
  error: {
    code: 'unauthorized' | 'rate_limited' | 'invalid_request' | 'not_found' | 'forbidden' | 'server_error';
    message: string;
    details?: unknown;
  };
};
```

HTTP codes used: `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `413`, `429`, `500`.

### `POST /api/ingest`

**Auth:** `Authorization: Bearer aimeter_live_<random>`
**Rate limit:** 60 req/min/key, 5 MB max body.
**Idempotency:** `event.id` is the dedupe key. Insert with `ON CONFLICT (id) DO NOTHING`.

Request:
```ts
{
  events: Array<{
    id: string;
    agent: 'claude-code' | 'codex-cli' | 'gemini-cli' | 'anthropic-api' | 'openai-api';
    model: string;
    inputTokens: number;          // >= 0, integer
    outputTokens: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
    project?: string;             // <= 200 chars
    sessionId?: string;
    ts: string;                   // ISO 8601 UTC
  }>;
  cliVersion: string;
}
```

Response 200:
```ts
{ accepted: number; deduped: number; rejected: Array<{ id: string; reason: string }> }
```

Errors: `401 unauthorized` (invalid/revoked key), `400 invalid_request` (zod fail), `413 payload_too_large`, `429 rate_limited`.

Server flow: validate key → look up `org_id`/`user_id` from key hash → zod-validate body → for each event compute `cost_usd` from pricing (org overrides → defaults) → bulk insert → enqueue rollup (debounced 60s per org) → return counts.

### `POST /api/cli/auth/init`

Public. Body: `{ deviceLabel: string }`. Response: `{ deviceCode, userCode, verificationUrl: 'https://app.infoc.one/cli-auth?code=USERCODE', expiresIn: 600 }`. Stores row in `cli_auth_codes` with `status='pending'`, `expires_at = now + 10m`.

### `POST /api/cli/auth/exchange`

Public. Body: `{ deviceCode }`. Polled by CLI every 2s.
- `pending` → respond `204`
- `authorized` → respond `200 { apiKey, userId, orgId }` then mark `expired` so the code can't be reused
- `expired` or unknown → respond `410 Gone`

### `POST /api/cli/keys/revoke`

Auth: Clerk session. Body: `{ keyId }`. Sets `revoked_at = now`. Response `204`.

### `GET /api/orgs/:orgId/usage`

Auth: Clerk session, must belong to `orgId`. Query: `from`, `to` (ISO dates), `groupBy` (`agent`|`model`|`user`|`day`).
Response:
```ts
{
  totals: { tokens: number; costUsd: number; events: number };
  rows: Array<{ key: string; tokens: number; costUsd: number; events: number }>;
}
```
Reads from `daily_rollups`.

### `GET /api/orgs/:orgId/users`

Lists users with last-30-day spend and sparkline data.

### `GET /api/orgs/:orgId/export.csv`

Streams CSV of events in the given range. Headers: `timestamp,user_email,agent,model,input,output,cache_r,cache_w,cost_usd,project,session_id`.

### `POST /api/webhooks/stripe`

Signature-verified. Events:
- `checkout.session.completed` → create/upgrade org subscription
- `customer.subscription.updated` → sync seat count, plan
- `customer.subscription.deleted` → set `plan='cancelled'`
- `invoice.payment_failed` → mark `paused` after 2nd failure

### `POST /api/webhooks/clerk`

Svix-signature-verified. Events:
- `user.created` → upsert `users`
- `organization.created` → upsert `organizations`
- `organizationMembership.created/deleted` → adjust `seat_count` and call Stripe to update subscription quantity

### `POST /api/webhooks/slack`

Slack signature verification. Handles `app_uninstalled`, `tokens_revoked`.

### `POST /api/waitlist`

Public. Body: `{ email, source?, utm? }`. Insert into `waitlist`. Send confirmation email via Resend. Response `204`.

### `GET /api/health`

`200 { status: 'ok', commit: string, time: string }`. Used by uptime.

### `GET|POST /api/inngest`

Inngest serve handler. Auth via Inngest signing key.

---

## 8. Authentication

### Web app
- **Provider:** Clerk with Organizations enabled.
- **Sign-in:** email + magic link only `[ASSUMPTION: defer Google/SSO]`.
- **Org creation:** required during onboarding.
- **Roles:** `owner`, `admin`, `member`. Only `owner`/`admin` manage billing, alerts, integrations, and any other user's API keys.
- **Middleware:** `apps/web/middleware.ts` protects all `(app)` routes. Public routes: `/`, `/pricing`, `/privacy`, `/terms`, `/docs/*`, `/sign-in`, `/sign-up`, `/cli-auth`, `/api/webhooks/*`, `/api/health`, `/api/cli/*`, `/api/ingest`, `/api/waitlist`.

### API key (CLI)
- Format: `aimeter_live_<32 random chars [a-z0-9]>` (44 chars total).
- Stored as `sha256(key)` in `api_keys.key_hash`. Plaintext shown once at creation, never retrievable.
- Issued only via the CLI device-code flow.
- Revocable from dashboard.
- `POST /api/ingest` looks up the hash, updates `last_used_at`, rejects if `revoked_at` is set.

### CLI device-code flow

```
CLI                                    Server                              Browser
 │── POST /cli/auth/init ──────────────▶│                                    │
 │◀── { userCode, verificationUrl } ────│                                    │
 │ open verificationUrl ─────────────────────────────────────────────────────▶│
 │                                       │◀── user signs in via Clerk ───────│
 │                                       │◀── user picks org, confirms ──────│
 │                                       │── stores authorized state ────────│
 │── poll /cli/auth/exchange every 2s ──▶│                                    │
 │── … 204 …                              │                                    │
 │◀── 200 { apiKey, userId, orgId } ─────│                                    │
 │ writes ~/.infoc-aimeter/config.json   │                                    │
```

CLI and server both expire the device code at 10 minutes.

---

## 9. CLI agent specification

### Distribution
- npm: `@infoc/aimeter-cli`, public. Binary: `aimeter`.
- Install: `npm install -g @infoc/aimeter-cli`.
- `[ASSUMPTION]` Phase 2: also Homebrew tap `infoc/tap` and a Scoop bucket.

### Commands

```
aimeter init                 # First-time auth + config write
aimeter start                # Watch in foreground
aimeter start --daemon       # Detach, write pid to ~/.infoc-aimeter/pid
aimeter stop                 # Stop daemon
aimeter status               # Running state, last-flush, pending events
aimeter logout               # Clear local config; revoke key on server
aimeter doctor               # Diagnose paths, perms, network, auth
aimeter --version
aimeter --help
```

### Config file
- macOS/Linux: `~/.infoc-aimeter/config.json`
- Windows: `%USERPROFILE%\.infoc-aimeter\config.json`
- Permissions: `0600`. CLI exits with error if perms are looser.

### Watcher
- `chokidar` with `awaitWriteFinish: { stabilityThreshold: 200 }`.
- Watches three roots by default (overridable):
  - `~/.claude`, `~/.codex`, `~/.gemini`
- Per-file byte offset tracked in `~/.infoc-aimeter/state.json` so restarts resume.

### Pusher
- Flush every 30s, **or** when buffer >100 events, **or** on SIGINT/SIGTERM.
- POST batch to `/api/ingest`. Retry with backoff: 1s, 5s, 30s, 5m. After 5m, queue to `~/.infoc-aimeter/outbox/` and retry every 5m.
- Dedupe by `event.id` (CLI hashes `agent + upstream_id` for stable IDs across retries).

### Privacy
- Never reads source code, file contents, prompt text, or completions.
- Parsers explicitly **drop** these fields if present in upstream JSONL.
- Never sends env vars, file paths, or metadata beyond what's in the API contract.

### `aimeter doctor` example output
```
✔ Config readable, perms 0600
✔ API reachable (api.infoc.one, 89ms)
✔ Auth valid (user: sarah@acme.com, org: acme-eng)
✔ Claude Code logs found: ~/.claude/projects (14 sessions)
✔ Codex CLI logs found: ~/.codex/sessions (7 sessions)
✘ Gemini CLI logs not found: ~/.gemini/sessions
  → If you don't use Gemini CLI, ignore. Else verify the agent is installed.
✔ Outbox empty
✔ Daemon running (pid 12345, started 2h ago)
```

---

## 10. Parser specifications

### Common contract (`packages/parsers/src/base.ts`)

```ts
export abstract class JsonlParser extends EventEmitter {
  abstract readonly agent: AgentId;
  abstract readonly defaultPaths: string[];
  abstract parseLine(line: string, file: string): UsageEvent[];
}
```

### Claude Code parser

- **Default paths:** `~/.claude/projects/**/*.jsonl`
- **Schema (representative):**
```json
{
  "type": "assistant",
  "message": {
    "id": "msg_01ABC",
    "model": "claude-opus-4-7",
    "usage": {
      "input_tokens": 1234,
      "output_tokens": 567,
      "cache_read_input_tokens": 8910,
      "cache_creation_input_tokens": 200
    }
  },
  "timestamp": "2026-05-05T12:00:00.000Z",
  "sessionId": "ses_abc"
}
```
- **Mapping:** `id = sha256("claude-code:" + message.id)`, `agent = "claude-code"`, `model = message.model`, tokens map directly, `ts = timestamp`, `project = path-derived slug from .../projects/<slug>/...`.
- **Defensive:** drop record if `usage` absent. Tolerate missing fields by treating as 0.

### Codex CLI parser

- **Default paths:** `~/.codex/sessions/**/*.jsonl`
- **Mapping:** look in `payload.usage` or `usage`. `prompt_tokens` → `inputTokens`, `completion_tokens` → `outputTokens`, `cached_tokens` → `cacheReadTokens`. `created_at` (epoch s) or `timestamp` (ISO) → `ts`.

### Gemini CLI parser

- **Default paths:** `~/.gemini/sessions/**/*.jsonl` `[ASSUMPTION: verify exact log location and JSONL schema before writing — Gemini CLI in active development]`
- **Mapping:** `usageMetadata.promptTokenCount`, `candidatesTokenCount`, `cachedContentTokenCount`.

### Anthropic API account-level pull

- Server-side, not from CLI.
- Org admin pastes an Anthropic API key in Settings → Integrations.
- Inngest cron (every 6h) calls Anthropic's usage endpoint, fetches per-day per-model spend, inserts as synthetic events with `agent='anthropic-api'`. `[ASSUMPTION: confirm exact endpoint and per-key granularity at build time]`

### OpenAI API account-level pull

Same shape, `agent='openai-api'`.

### Fixture-based tests

Each parser ships at least 3 real (anonymized) JSONL fixtures in `packages/parsers/fixtures/<agent>/v<version>.jsonl`. Tests in `packages/parsers/tests/<agent>.test.ts` assert exact normalized output. CI runs them.

---

## 11. Pricing table

`packages/pricing/src/models.ts`:

```ts
import type { PricingEntry } from './index';

/**
 * Per 1,000,000 tokens, USD.
 * [ASSUMPTION: Snapshot 5 May 2026. Verify against official pricing pages
 * before launch. Users override per-model via Settings → Pricing Overrides.]
 */
export const DEFAULT_PRICING: Record<string, PricingEntry> = {
  // Anthropic
  'claude-opus-4-7':   { input: 15.00, output: 75.00, cacheRead: 1.50, cacheWrite: 18.75 },
  'claude-opus-4-6':   { input: 15.00, output: 75.00, cacheRead: 1.50, cacheWrite: 18.75 },
  'claude-sonnet-4-6': { input:  3.00, output: 15.00, cacheRead: 0.30, cacheWrite:  3.75 },
  'claude-haiku-4-5':  { input:  1.00, output:  5.00, cacheRead: 0.10, cacheWrite:  1.25 },

  // OpenAI
  'gpt-5':             { input:  5.00, output: 20.00, cacheRead: 0.50, cacheWrite: 0 },
  'gpt-5-codex':       { input:  5.00, output: 20.00, cacheRead: 0.50, cacheWrite: 0 },
  'gpt-4.1':           { input:  2.50, output: 10.00, cacheRead: 0.25, cacheWrite: 0 },
  'o4-mini':           { input:  1.10, output:  4.40, cacheRead: 0.11, cacheWrite: 0 },

  // Google
  'gemini-3-flash':    { input:  0.30, output:  1.20, cacheRead: 0.075, cacheWrite: 0 },
  'gemini-3-pro':      { input:  3.50, output: 14.00, cacheRead: 0.875, cacheWrite: 0 },
};
```

```ts
export function computeCost(e: UsageEvent, overrides?: PricingMap): number {
  const p = overrides?.[e.model] ?? DEFAULT_PRICING[normalize(e.model)] ?? ZERO;
  return (
    (e.inputTokens     * p.input)     +
    (e.outputTokens    * p.output)    +
    (e.cacheReadTokens * p.cacheRead) +
    (e.cacheWriteTokens* p.cacheWrite)
  ) / 1_000_000;
}
```

`normalize` strips dated suffixes (`-20251001`).

---

## 12. Web app specification

### Route map

| Route | Auth | Purpose |
|---|---|---|
| `/` | public | Landing |
| `/pricing` | public | Pricing |
| `/privacy`, `/terms` | public | Legal |
| `/docs/[...]` | public | Docs |
| `/sign-in`, `/sign-up` | public | Clerk |
| `/cli-auth` | clerk-required | CLI device-code browser side |
| `/onboarding` | authed | Org create + invite + Slack |
| `/dashboard` | authed | Main dashboard |
| `/users` | authed | Per-user breakdown |
| `/settings` | authed | Index |
| `/settings/billing` | owner/admin | Stripe portal link |
| `/settings/slack` | owner/admin | Slack install + channel |
| `/settings/api-keys` | authed (own); admin sees all | Manage keys |
| `/settings/alerts` | admin | Alert rules |
| `/settings/pricing-overrides` | admin | Per-model price overrides |

### Dashboard

Top row, three cards: **Tokens (window)**, **Cost (window)**, **Events (window)**.
Window picker: Today / 7d / 30d / Custom.

Charts:
1. **Daily trend** — bar chart, cost per day, color-segmented by agent.
2. **By agent** — horizontal bars, cost.
3. **By model** — sortable table.

Below: **By user** — table with avatar, name, email, last-30-day cost, % of org spend, sparkline.

Empty state: "No events yet. Run `npm i -g @infoc/aimeter-cli && aimeter init` on each developer's machine."

### Onboarding flow

Three steps after sign-up:
1. Create org (Clerk).
2. Invite teammates (skip allowed).
3. Show CLI install instructions with copy-to-clipboard. Optional: connect Slack now or later.

### Component structure
- `components/dashboard/SummaryCards.tsx`
- `components/dashboard/DailyTrendChart.tsx` (recharts)
- `components/dashboard/ByAgentChart.tsx`
- `components/dashboard/UserTable.tsx`
- `components/marketing/Hero.tsx`, `ProblemStrip.tsx`, `SolutionCards.tsx`, `Pricing.tsx`, `Faq.tsx`, `Footer.tsx`

All built on shadcn/ui primitives.

### Styling
- Tailwind 4, CSS-first config in `globals.css`.
- Brand tokens: `--color-navy: #0F172A; --color-teal: #0D9488; --color-amber: #F59E0B`.
- Typography: Inter `[ASSUMPTION: replace if brand guide says otherwise]`.

---

## 13. Background jobs (Inngest)

`apps/web/inngest/functions/`. Registered at `/api/inngest`.

### `daily-rollup`
- Trigger: `usage.event.ingested` event (fanout from `/api/ingest`), debounced per-org with 60s throttle.
- SELECT new events since last rollup → upsert `daily_rollups` grouped by `(user, agent, model, date)`.

### `daily-digest`
- Trigger: cron `0 * * * *` (every hour). Inside, check each org whose local time = `digestHour:00`.
- For each, compose Slack Block Kit message and POST via stored bot token.

### `anomaly-check`
- Trigger: cron `0 */4 * * *` (every 4h).
- For each user: compute trailing 7-day mean & stdev of daily cost. If today > mean + 2σ AND > $20, fire alert. Suppress same user-agent pair within 24h.

### `stripe-sync`
- Trigger: webhook `customer.subscription.updated`.
- Sync `seatCount`, `plan`, `stripeSubscriptionId`.

### `clerk-sync`
- Trigger: Clerk webhook `organizationMembership.*`.
- Adjust seat count via Stripe `subscriptions.update`.

---

## 14. Slack integration

### Install flow
- Settings → Slack → "Add to Slack" → OAuth v2.
- Scopes: `chat:write`, `channels:read`, `im:write`.
- Store encrypted bot token (AES-256-GCM with `TOKEN_ENCRYPTION_KEY`), `teamId`, `botUserId`, `defaultChannelId`.
- After install: ask user to pick a default channel.

### Daily digest (Block Kit)

```
:moneybag: *AIMeter daily digest — {date}*

Yesterday your team spent *${total}* on AI tools.
{trend_arrow} {pct}% vs trailing 7-day average.

*Top spenders*
1. {user1} — ${amount1}
2. {user2} — ${amount2}
3. {user3} — ${amount3}

*By agent*
{agent_breakdown_inline}

<{dashboardUrl}|Open dashboard> · <{billingUrl}|Manage billing>
```

### Anomaly alert

```
:warning: *Spend spike: {user}*
{user}'s AI spend was *${today}* on {date} — *{factor}×* their typical baseline (${baseline}/day).

*Top tools used*
{tool_breakdown}

<{userDashboardUrl}|View detail>
```

### Bot identity
- Display name: `AIMeter`
- App icon: AIMeter mark, 240×240 PNG `[ASSUMPTION: design asset to be produced]`

---

## 15. Stripe integration

### Products and prices to create in Stripe dashboard

| Product | Price ID env var | Type | Amount |
|---|---|---|---|
| AIMeter Team (monthly) | `STRIPE_PRICE_ID_TEAM_SEAT_MONTHLY` | recurring per_seat | $99/mo USD |
| AIMeter Team (annual) | `STRIPE_PRICE_ID_TEAM_SEAT_ANNUAL` | recurring per_seat | $990/yr USD `[ASSUMPTION: 17% annual discount; defer Phase 2]` |

### Checkout
- 14-day trial without card collection (`subscription_data.trial_period_days = 14`, `payment_method_collection = 'if_required'`) `[ASSUMPTION]`
- Success URL: `https://app.infoc.one/onboarding?checkout=success`
- Cancel URL: `https://infoc.one/pricing?checkout=cancelled`

### Customer portal
- Pre-configure: update payment, view invoices, cancel subscription. Disable plan changes (single plan).

### Webhook events
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.payment_succeeded`

### Seat-count sync
- Clerk org member added → `subscriptions.update({ items: [{ id, quantity }] }, { proration_behavior: 'create_prorations' })`.
- Removed → decrement. Allow zero.

---

## 16. Error handling

### Server (API routes)
- All handlers wrapped in `withErrorHandler` that catches, logs, returns `ApiError` envelope.
- Zod parse errors → 400 with `details`.
- Unauth → 401. Forbidden → 403. Not found → 404.
- Unexpected → 500, log with stack to Sentry, do **not** leak details to client.

### Client (web)
- Root error boundary in `apps/web/app/error.tsx`.
- Toasts for transient failures (`use-toast` from shadcn).
- Network errors retried once, then surface "Something went wrong" with refresh CTA.

### CLI
- Exit codes: `0` success, `1` user error, `2` config error, `3` network, `4` auth.
- All errors logged to `~/.infoc-aimeter/logs/cli.log` with timestamp.
- `aimeter doctor` is the first thing support tells users to run.

---

## 17. Logging

### Web
- Logger: `pino`. Single shared instance from `apps/web/lib/logger.ts`.
- Format: JSON. Fields: `level`, `msg`, `time`, `request_id`, `org_id`, `user_id`, `route`.
- Levels: `LOG_LEVEL` env (`debug` dev, `info` prod).
- Destination: stdout in dev (pretty), Axiom transport in prod.

### CLI
- Lightweight wrapper around `console`, gated by `--verbose`.
- File log rotated daily, max 5 files × 10 MB.

### What to log
- Every API request: `method`, `path`, `status`, `duration_ms`, `org_id`, `user_id`.
- Every CLI flush: `events_count`, `bytes`, `duration_ms`.
- Every webhook: type + outcome.
- Errors: full stack via Sentry; redacted in logs (no API keys, tokens, or PII beyond email).

---

## 18. Testing

### Unit (vitest)
- Every parser: ≥3 fixtures → assert exact `UsageEvent[]` output.
- Pricing: edge cases (unknown model, negative tokens, dated id).
- Aggregator helpers.
- Zod schemas (round-trip).

### Integration (vitest + msw)
- API routes against a Postgres testcontainer `[ASSUMPTION: defer if too slow; mock the DB layer instead]`.
- Stripe webhooks: signed fixtures.
- Clerk webhooks: signed fixtures.

### E2E `[ASSUMPTION: Playwright deferred to Phase 2; manual smoke in Phase 1]`

### Coverage
- Targets: 80% statements on `packages/parsers`, `packages/pricing`, `packages/db/queries`. No coverage gate elsewhere.

### Smoke checklist (manual, every milestone)
- Sign up → create org → empty dashboard.
- `aimeter init` → device-code auth completes.
- Run a Claude Code session → events appear within 90s.
- Connect Slack → trigger digest manually → message arrives.
- Stripe Checkout test card → seat count syncs.
- Revoke API key → next CLI flush returns 401.

---

## 19. Build, run, dev, deploy commands

### Root `package.json` scripts

```json
{
  "scripts": {
    "dev":          "pnpm -r --parallel dev",
    "dev:web":      "pnpm --filter @infoc/web dev",
    "dev:cli":      "pnpm --filter @infoc/aimeter-cli dev",
    "build":        "pnpm -r build",
    "lint":         "eslint .",
    "lint:fix":     "eslint . --fix",
    "format":       "prettier --write .",
    "typecheck":    "pnpm -r typecheck",
    "test":         "vitest run",
    "test:watch":   "vitest",
    "test:cov":     "vitest run --coverage",
    "db:generate":  "pnpm --filter @infoc/db generate",
    "db:migrate":   "pnpm --filter @infoc/db migrate",
    "db:studio":    "pnpm --filter @infoc/db studio",
    "seed":         "tsx tools/seed.ts",
    "reset-db":     "tsx tools/reset-db.ts",
    "release:cli":  "pnpm --filter @infoc/aimeter-cli publish --access public",
    "prepare":      "husky"
  }
}
```

### First-run sequence (developer onboarding)

```bash
git clone https://github.com/infoc/aimeter.git
cd aimeter
nvm use                  # picks up .nvmrc → 22.11.0
corepack enable
pnpm install
cp .env.example apps/web/.env.local   # then fill secrets
pnpm db:migrate
pnpm seed
pnpm dev                              # → http://localhost:3000
```

### Deploy
- **Web app:** push to `main` → Vercel auto-deploys. Preview deploys per PR.
- **CLI:** tag `cli-v0.1.0` → GitHub Actions runs `release-cli.yml` → publishes to npm.
- **DB migrations:** run from CI on `main` after deploy succeeds: `pnpm db:migrate`.
- **Inngest:** functions auto-discovered when `apps/web` deploys.

---

## 20. Lint and format

### `eslint.config.js` (flat)
- Extends `@typescript-eslint/recommended-type-checked` + `next/core-web-vitals` for `apps/web`.
- Rules: `no-floating-promises: error`, `no-explicit-any: error`, `consistent-type-imports: error`, `prefer-const: error`.
- Custom rule: ban `process.env.X` outside `lib/env.ts`.

### `prettier.config.mjs`
```js
export default {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  arrowParens: 'always',
  plugins: ['prettier-plugin-tailwindcss'],
};
```

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

## 21. CI/CD

### `.github/workflows/ci.yml`

```yaml
name: CI
on:
  pull_request:
  push: { branches: [main] }
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
      - run: pnpm build
```

### `.github/workflows/release-cli.yml`

```yaml
name: Release CLI
on:
  push:
    tags: ['cli-v*']
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
          registry-url: https://registry.npmjs.org
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @infoc/aimeter-cli build
      - run: pnpm --filter @infoc/aimeter-cli publish --access public --no-git-checks
        env: { NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }} }
```

### Vercel project settings
- Root directory: `apps/web`
- Build command: `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @infoc/web build`
- Output directory: `.next`
- Env vars: copy from `.env.example`, populate prod values.

---

## 22. Phase 0 — Landing page (Week 1–2)

### Deliverable
A single Next.js page at `infoc.one`, no backend beyond Resend for email capture and a Stripe Payment Link for the early-access click. **Does not require any of the Phase 1 schema or auth.**

### Page structure (top to bottom)

#### Hero
- H1: **Track every AI coding agent in one dashboard.**
- Sub: *Built for the engineering lead whose AI bill doubled last quarter. Claude Code, Codex, Gemini CLI, Copilot, Cursor — one number, one dashboard, one Slack digest.*
- Primary CTA: **Get early access — $99/seat/month** (Stripe Payment Link, waitlist mode)
- Secondary CTA: **Book a 15-min call** (Calendly link)

#### Problem strip (3 stats, large)
- *2× — typical eng-team AI spend, doubling each quarter*
- *3+ vendors — Anthropic, OpenAI, GitHub, all separate dashboards*
- *0 — purpose-built tools for team-level attribution today*

#### Solution (3 cards)
- **Multi-agent.** Claude Code, Codex, Gemini, Copilot, Cursor — one view.
- **Team-first.** Per-person attribution, daily Slack digest, anomaly alerts, CSV for finance.
- **Neutral.** We don't sell AI tokens. The angle providers can't credibly take.

#### How it works (3 steps)
1. Each developer runs `aimeter init` once.
2. AIMeter watches their AI agents and reports usage privately to your team's dashboard.
3. You get a daily Slack digest. Finance gets a CSV. No more screenshots.

#### Pricing
- **Team — $99/seat/month.** 14-day free trial. Cancel anytime.

#### FAQ (6 entries)
1. *Which agents do you support?* Claude Code, Codex CLI, Gemini CLI in v1. Copilot, Cursor, Windsurf in v2. Account-level Anthropic/OpenAI pulls cover BYOK extensions (Cline, Roo, Continue, Aider).
2. *Where does my data live?* Hosted Postgres, encrypted at rest. We capture token counts and metadata only — never source code, never prompts, never completions.
3. *How accurate is it?* Token counts are pulled directly from each agent's session logs, matching the provider's billing. Cost is computed from current public pricing; override per-model in Settings.
4. *Does it work offline?* The CLI buffers events locally and pushes when online.
5. *Can I self-host?* Not in v1. Talk to us if it's a blocker.
6. *Can I cancel?* Anytime, from the Stripe portal.

#### Footer
- Email: `hello@infoc.one`
- Privacy, Terms
- "Made by Infoc"

### Email capture (Resend)
- Inline form below hero: "Not ready yet? Get a heads-up at launch." → POST `/api/waitlist` → store in `waitlist`, send confirmation email.

### Calendly
- 15-min slot, 4 windows/day. `[ASSUMPTION: founder books these personally]`

### Pass gate after 14 days
- ≥ 15 qualified emails
- ≥ 3 booked discovery calls
- ≥ 1 Stripe Checkout click

If passed → Phase 1. If failed → `HANDOVER.md` § "What to do next" pivot ladder.

---

## 23. Phase 1 — MVP build (Week 3–6)

### Milestone 1 — Skeleton (Week 3, days 1–3)

**Tasks:**
- [ ] Init monorepo, configure pnpm workspaces, ESLint, Prettier, husky.
- [ ] Set up Neon dev branch, run first migration with all tables.
- [ ] Wire Clerk: sign-in, sign-up, org creation, middleware-protected `/(app)` routes.
- [ ] Wire Stripe: Checkout for monthly seat, webhook handler, seat-count sync.
- [ ] `/dashboard` empty state.
- [ ] Sentry + Axiom plumbed.

**Acceptance:** A new visitor signs up, creates an org, clicks Checkout (test mode), pays, lands on an empty dashboard. No 500s, no console errors.

### Milestone 2 — Capture (Week 3, days 4–7)

**Tasks:**
- [ ] `@infoc/aimeter-cli` — `init`, `start`, `status`, `logout`, `doctor`.
- [ ] Device-code flow + key issuance.
- [ ] Claude Code parser + ≥3 fixtures + tests.
- [ ] Codex CLI parser + fixtures + tests.
- [ ] Gemini CLI parser + fixtures + tests.
- [ ] `/api/ingest` with rate limiting, dedup, server-side cost compute.

**Acceptance:** `npm i -g @infoc/aimeter-cli`, run `aimeter init`, complete browser auth, run a Claude Code session, wait 90s, see events in DB and dashboard.

### Milestone 3 — Dashboard (Week 4)

**Tasks:**
- [ ] Daily-rollup Inngest function.
- [ ] Summary cards + window picker.
- [ ] Daily trend chart (recharts).
- [ ] By-agent + by-model breakdowns.
- [ ] Per-user table with sparklines.
- [ ] CSV export endpoint.

**Acceptance:** Dashboard p95 render <500ms with seeded data. CSV export downloads with correct columns, chronological, includes user emails for last 30 days.

### Milestone 4 — Slack + alerts (Week 5)

**Tasks:**
- [ ] Slack OAuth install flow + encrypted bot token storage.
- [ ] Channel picker.
- [ ] Daily digest function (cron + tz-aware).
- [ ] Anomaly check function (4-hourly).
- [ ] In-app settings page.

**Acceptance:** Trigger digest manually from settings → Slack message in 5s. Inflate one user's events → anomaly alert fires within 4h.

### Milestone 5 — Onboarding + first paying customer (Week 6)

**Tasks:**
- [ ] Onboarding wizard (org → invite → CLI install → Slack).
- [ ] Empty states polished.
- [ ] ToS + Privacy pages drafted `[ASSUMPTION: solo founder uses a TOS template; replace before scale]`.
- [ ] Status page placeholder.
- [ ] First paying customer onboarded white-glove.

**Acceptance:** A second teammate is invited, installs CLI, their events show up under their attribution, team lead sees both rows. First paying customer signs up self-serve, pays, runs a digest within 24h.

---

## 24. Phase 2 — Roadmap

Order driven by paying-customer feedback:
1. Copilot via GitHub OAuth app
2. Cursor + Windsurf parsers
3. VS Code extension as acquisition surface
4. Budgets and projections
5. Per-project / per-repo attribution
6. Annual billing + invoicing
7. SSO / SAML
8. Datadog / Grafana exporter

---

## 25. CLAUDE.md scaffolds

### `/CLAUDE.md`
```md
# AIMeter — Project Contract

Read first: HANDOVER.md, then SOLUTION.md.

This is a pnpm monorepo. Apps live in `apps/`, shared libraries in `packages/`.
Never modify a committed migration. Never add a runtime dep without explicit ask.
Strict TypeScript. Zod-validate every external input. Conventional Commits.

When working on:
- `apps/web` → see `apps/web/CLAUDE.md`
- `apps/cli` → see `apps/cli/CLAUDE.md`
- `packages/parsers` → see `packages/parsers/CLAUDE.md`
- `packages/db` → see `packages/db/CLAUDE.md`
```

### `apps/web/CLAUDE.md`
```md
Next.js 15 App Router. Tailwind 4. shadcn/ui. Clerk for auth.
Server Components by default. Use Server Actions only for Client Component
forms; otherwise prefer Route Handlers under `app/api/`.
Validate every body and query with zod. Use the `env` helper in `lib/env.ts`.
Never log API keys, tokens, or PII beyond email.
```

### `apps/cli/CLAUDE.md`
```md
Commander-based CLI. Pure JS deps only — no native modules (we ship to all OS).
Use chokidar with awaitWriteFinish. Treat the user's filesystem as untrusted:
catch every read error and continue. Never read source code or prompt content.
Default config: ~/.infoc-aimeter/config.json, mode 0600.
```

### `packages/parsers/CLAUDE.md`
```md
Each parser implements JsonlParser from `base.ts`. Add a fixture in
`fixtures/<agent>/v<version>.jsonl` and a test asserting the exact
normalized UsageEvent[] output. Tolerate missing fields (treat as 0).
Drop any field that could contain source code, prompts, or completions.
```

### `packages/db/CLAUDE.md`
```md
Drizzle ORM. Schema is the source of truth in `src/schema.ts`.
Generate migrations with `pnpm db:generate`. Never edit a committed migration.
All queries live in `src/queries/<table>.ts` and return typed results.
```

---

## 26. Definition of done

Self-verify before declaring a milestone complete.

### Repo health
- [ ] `pnpm install --frozen-lockfile` succeeds on fresh clone with Node 22.11.
- [ ] `pnpm typecheck` exits 0.
- [ ] `pnpm lint` exits 0.
- [ ] `pnpm test` exits 0 with coverage thresholds met.
- [ ] `pnpm build` exits 0.

### Functional (Phase 1 final)
- [ ] Visit `infoc.one` → marketing page, no console errors.
- [ ] Click "Get early access" → Stripe Checkout opens.
- [ ] Complete Checkout (test card) → land on `/onboarding`.
- [ ] Create org, invite teammate, complete onboarding.
- [ ] Run `npm i -g @infoc/aimeter-cli && aimeter init` on a real laptop with Claude Code installed.
- [ ] Browser opens to `cli-auth`, complete the flow.
- [ ] `aimeter doctor` → all checks pass for at least one agent.
- [ ] `aimeter start` → run a real Claude Code session for 5 minutes.
- [ ] Within 90s of session end, events appear on `/dashboard`.
- [ ] Per-user table shows attribution.
- [ ] `/api/orgs/:id/export.csv` downloads non-empty CSV with correct headers.
- [ ] Connect Slack from settings → OAuth completes → channel picker shows public channels.
- [ ] Manually trigger digest → message arrives in chosen channel within 5s.
- [ ] Inflate one user's spend programmatically → anomaly alert fires within 4h.
- [ ] Revoke API key from settings → next CLI flush returns 401, CLI logs auth error, exits 4.
- [ ] Trial ends after 14 days → org transitions to paused if no payment method.
- [ ] First paying customer is onboarded white-glove and uses the product unaided for 7 days.

### Operational
- [ ] All required env vars documented in `.env.example`.
- [ ] Sentry receives a deliberately-thrown error from each app (web, CLI, slack-bot).
- [ ] Axiom shows logs from the last 24h.
- [ ] Vercel preview deploy works on PR.
- [ ] CLI release pipeline tested with a `cli-v0.1.0-rc.1` tag.
- [ ] CI on main is green.

### Documentation
- [ ] `README.md` has install + run instructions.
- [ ] `HANDOVER.md` reflects the AIMeter / `infoc.one` rename.
- [ ] `SOLUTION.md` has every `[ASSUMPTION: …]` resolved or explicitly accepted.
- [ ] Every directory has a `CLAUDE.md`.
- [ ] At least one user-facing doc page exists at `/docs/install`.

### Security / privacy
- [ ] API keys stored as sha256, never plaintext.
- [ ] Slack bot tokens encrypted at rest (AES-256-GCM).
- [ ] Webhook signatures verified for Stripe, Clerk, Slack.
- [ ] No source code, prompts, or completions ever leave developer's machine — verified by parser unit tests.
- [ ] CSP headers set on all pages.
- [ ] HTTPS only; HSTS preload submitted.

When all boxes check, Phase 1 is done.

---

## 27. Assumptions index

Every `[ASSUMPTION: …]` in this document, listed for easy override:

1. § 3 — Latest-stable versions of all deps as of 5 May 2026; bump if newer compatible.
2. § 3 — Axiom for logs; could swap for Highlight or Better Stack.
3. § 4 — License is proprietary, not open source, in v1.
4. § 7 — Rate limit enforcement (in-memory now, Redis later).
5. § 8 — Email + magic-link sign-in only; defer Google / SSO.
6. § 9 — Homebrew/Scoop CLI distribution deferred to Phase 2.
7. § 10 — Gemini CLI exact log path/schema needs verification at build time.
8. § 10 — Anthropic billing API endpoint shape needs verification at build time.
9. § 11 — Pricing snapshot is 5 May 2026; verify before launch.
10. § 12 — Inter font; replace if brand guide differs.
11. § 14 — Bot icon asset to be designed.
12. § 15 — Annual price 17% discount; defer to Phase 2.
13. § 15 — 14-day trial without card.
14. § 18 — Postgres testcontainer for integration tests; defer if too slow.
15. § 18 — Playwright deferred to Phase 2.
16. § 22 — Founder personally takes Calendly calls in Phase 0.
17. § 23 — TOS/Privacy from a template; lawyer review later.

Override any assumption by editing this file and committing before starting work.

---

*Last updated: 5 May 2026.*

## Changelog

- **2026-05-05** — Audit + gaps + autopilot-grade rewrite. Renamed product to AIMeter; domain to infoc.one. Added: env contract, full schema with enums and indexes, complete API contracts, CLI command spec, parser specs with fixtures, pricing table, web route map, Inngest functions, Slack/Stripe specs, error/log/test/CI policies, build commands, Phase 0 landing copy, milestone acceptance criteria, CLAUDE.md scaffolds, Definition of Done, assumptions index.
