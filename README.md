# INFOC ONE AIMeter

> Meter every AI agent, in one place.

![INFOC ONE AIMeter hero](media/hero.png)

> ## Pilot release - please read before installing
>
> AIMeter is currently a **pilot release** offered free of charge during evaluation.
> All cost figures are **best-effort estimates from API rates**, not actual bills.
> Your provider plan (for example Pro, Max, enterprise, bundles, or credits) can produce different billed amounts.
> The Extension is provided **"as is"** with no warranty.
> See [DISCLAIMER.md](./DISCLAIMER.md) for the full terms, [PRIVACY.md](./PRIVACY.md)
> for the privacy policy, and [LICENSE](./LICENSE) for the MIT license under
> which AIMeter is distributed.
>
> By installing or using AIMeter you agree to those terms.

AIMeter is a free VS Code extension that shows your AI coding-agent token usage and estimated cost inside VS Code. It reads local JSONL session logs for supported local agents and can optionally import GitHub Copilot usage from GitHub's API when you explicitly connect it.

## Features

- Track Claude Code, Codex CLI, and Gemini CLI usage from local session logs
- Optionally import GitHub Copilot usage with a user-provided PAT stored in VS Code SecretStorage
- Show today's estimated cost or token count in the status bar
- Open a sidebar dashboard for Today, 7d, and 30d usage windows
- Break down usage by agent, model, and recent session
- Export local event data to CSV
- Run Doctor diagnostics for parser paths, storage, Copilot connection, and pricing freshness
- Override pricing rates per model for local estimated cost calculations

All cost figures are estimates with confidence indicators based on API rates. AIMeter never claims to match provider billing, especially for plan-included usage.

## Installation

1. Marketplace: install `infoc-one.aimeter` from the VS Code Marketplace.
2. Command line: run `code --install-extension infoc-one.aimeter` after Marketplace publish.
3. Local VSIX: download the release `.vsix`, then run `code --install-extension aimeter-0.1.0.vsix`.

## Privacy

AIMeter has no telemetry, no analytics, no AIMeter account, and no AIMeter backend. It never reads source code, editor buffers, prompts, completions, workspace file contents, or environment variables.

Local agent data stays in VS Code extension storage on your machine. GitHub Copilot import is disabled by default and only runs after you connect it; the PAT is stored in VS Code SecretStorage, never settings, logs, event data, CSV exports, or source control.

Read the full privacy note in [PRIVACY.md](https://github.com/infoc-one/aimeter-infoc-one/blob/main/PRIVACY.md).

## Supported Agents

| Source                                             | Status          | How AIMeter reads it                                              |
| -------------------------------------------------- | --------------- | ----------------------------------------------------------------- |
| Claude Code                                        | Supported       | Local JSONL session logs under `~/.claude/projects`               |
| Codex CLI                                          | Supported       | Local JSONL session logs under `~/.codex/sessions`                |
| Gemini CLI                                         | Supported       | Local JSONL session logs under `~/.gemini/sessions`               |
| GitHub Copilot                                     | Optional import | GitHub usage API after explicit PAT connection                    |
| Cursor / Windsurf / Cline / Roo / Continue / Aider | Not in v0.1.0   | Deferred until there is a trusted local log or approved usage API |

## Important Settings

- `aimeter.statusBar.enabled`: show or hide the status bar item
- `aimeter.statusBar.format`: choose `cost-today`, `tokens-today`, or `both`
- `aimeter.parsers.claudeCode.enabled`: watch Claude Code logs
- `aimeter.parsers.codexCli.enabled`: watch Codex CLI logs
- `aimeter.parsers.geminiCli.enabled`: watch Gemini CLI logs
- `aimeter.providers.githubCopilot.enabled`: enable GitHub Copilot usage import after connecting a PAT
- `aimeter.pricing.overrides`: override estimated model pricing locally
- `aimeter.retention.days`: choose how long event history is kept locally
- `aimeter.network.updateCheck`: optional update check, off by default

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

## Screenshots

Founder TODO: replace `media/icon.png` with the final 128x128 production icon before Marketplace submission. The current file is a placeholder release asset.

Real Marketplace screenshots will live under `media/screenshots/` before publish:

- `media/screenshots/01-dashboard-dark.png`
- `media/screenshots/02-dashboard-light.png`
- `media/screenshots/03-status-bar.png`
- `media/screenshots/04-doctor.png`
- `media/screenshots/05-settings.png`
- `media/screenshots/06-demo.gif`

These must be real captures from the extension UI, not generated placeholders.

## Roadmap

Track 1 v0.1.x stays focused on the free VS Code extension:

- Harden local parsers and schema fixtures
- Improve dashboard polish and empty states
- Add real Marketplace screenshots and a short demo GIF
- Expand Doctor diagnostics for common Windows, macOS, and Linux path issues
- Add more local-agent sources only when there is a trusted token log or approved usage API

No backend, SaaS, team sync, payment logic, license checks, or telemetry are planned for Track 1.

## Contributing

Issues and discussions are welcome:

- Bugs: https://github.com/infoc-one/aimeter-infoc-one/issues
- Discussions: https://github.com/infoc-one/aimeter-infoc-one/discussions

Before contributing code, read [CLAUDE.md](CLAUDE.md), [DECISIONS.md](DECISIONS.md), and [SOLUTION.md](SOLUTION.md). Privacy rules are product rules in this repo.

## License

MIT. Copyright (c) 2026 Infochola Solutions Pte Ltd.
