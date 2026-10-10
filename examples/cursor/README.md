# Cursor project setup

Run from the repository root:

```bash
npm install --save-dev @agent-utils/agent-guard
npx agent-guard init
npx agent-guard adapters install cursor
git add agent-guard.config.json .cursor/hooks.json
```

Open the repository as a trusted Cursor workspace. The generated `preToolUse` hook is fail-closed for direct `Read`, `Write`, and `Edit` tools. Keep Cursor's native run mode and sandbox enabled.
