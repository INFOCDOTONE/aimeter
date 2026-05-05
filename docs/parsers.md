# Parsers

Parser implementation notes will expand as Milestones 2 and 3 add Codex CLI and Gemini CLI.

## GitHub Copilot

GitHub Copilot is not parsed in Track 1 because it does not expose a reliable local token usage log comparable to Claude Code, Codex CLI, or Gemini CLI JSONL session logs. AIMeter must not estimate Copilot usage from prompts, editor buffers, network traffic, or workspace files.

The Doctor view surfaces this as a limitation. A future Copilot parser needs a trusted local usage source that contains token counts without prompt, completion, or source-code content.
