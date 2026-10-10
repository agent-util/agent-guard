# Claude Code project setup

Run from the repository root:

```bash
npm install --save-dev @agent-utils/agent-guard
npx agent-guard init
npx agent-guard adapters install claude-code
git add agent-guard.config.json .claude/settings.json
```

Claude Code will invoke the Agent Guard `PreToolUse` hook for its direct `Read`, `Write`, `Edit`, and `NotebookEdit` tools. Keep Claude Code's native permissions enabled; arbitrary shell filesystem access is not covered by this adapter.
