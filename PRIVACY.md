# INFOC ONE AI Meter Privacy

INFOC ONE AI Meter is local-first. It has no AI Meter account, no AI Meter backend, no telemetry, no analytics, and no payment or licensing service.

## Summary

- Local JSONL parsers read token usage logs from Claude Code, Codex CLI, and Gemini CLI.
- GitHub Copilot usage is optional and is imported from GitHub's usage API only after the user explicitly connects it.
- AI Meter never reads source code, editor buffers, workspace file contents, prompts, completions, or environment variables.
- Provider credentials are stored only in VS Code SecretStorage and are never written to settings, local event JSONL, CSV exports, logs, or source control.
- Event data stays in VS Code's extension storage on the user's machine.
- Costs are estimates with confidence indicators. AI Meter never claims to match provider billing.

## Default Local Behavior

By default, AI Meter watches local session-log folders and stores normalized usage events under VS Code's extension storage. No provider usage API import runs unless the user enables it through an explicit command or setting.

The optional `aimeter.network.updateCheck` setting is off by default. If enabled in a future update-check implementation, it may make a limited catalog-check request without sending usage data, event data, source code, prompts, completions, local identifiers, or machine fingerprints.

## GitHub Copilot Usage Import

GitHub Copilot does not expose a reliable local token usage log comparable to Claude Code, Codex CLI, or Gemini CLI JSONL logs. AI Meter therefore treats Copilot as an opt-in provider usage import, not as a local parser.

The user connects Copilot with `AI Meter: Connect GitHub Copilot Usage...` or the dashboard `Connect Copilot` button. The required input is one GitHub Personal Access Token that can read Copilot usage. AI Meter does not require a GitHub username, organization, endpoint, or local file path for the current user-level import.

When enabled, AI Meter calls only GitHub's approved usage endpoint:

```text
GET https://api.github.com/user/copilot_usage
```

The PAT is sent only in the `Authorization: Bearer <token>` header. AI Meter does not send source code, prompts, completions, workspace file contents, local event exports, install IDs, machine fingerprints, or AI Meter telemetry in that request.

The PAT is stored under the AI Meter SecretStorage key `githubCopilot.token`. Disconnecting Copilot deletes that secret and disables the import setting.

## What AI Meter Never Does

- Never sends data to an AI Meter-owned server during Track 1.
- Never reads or transmits source code, editor buffers, workspace files, prompts, completions, or environment variables.
- Never stores API credentials in settings, logs, event data, CSV exports, or source control.
- Never uses telemetry SDKs such as Application Insights, PostHog, Mixpanel, or similar tools.
- Never uses machine-derived identifiers. The local install ID is `crypto.randomUUID()` and is never transmitted.

## Verification

The test suite includes parser forbidden-field tests and integration coverage that asserts zero outbound network calls by default. Provider usage imports are disabled by default and covered by focused tests that verify no GitHub request is made when the setting is off or when no token is stored.

If AI Meter ever makes an undisclosed network call, stores a credential outside SecretStorage, or persists prompt/source/completion data, treat it as a P0 privacy bug.
