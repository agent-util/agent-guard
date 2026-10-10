# OpenAI Codex project setup

Run from the repository root:

```bash
npm install --save-dev @agent-utils/agent-guard
npx agent-guard init
npx agent-guard adapters install codex
git add agent-guard.config.json .codex/hooks.json
```

Trust the project hooks when Codex asks. The generated `PreToolUse` hook checks file paths declared by `apply_patch`. It does not disable, weaken, or replace the Codex sandbox and approval controls.
