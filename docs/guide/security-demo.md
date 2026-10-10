# 60–90 second security demo

This reproducible terminal demo shows three outcomes: an allowed source read, a denied `.env` read, and a denied MCP write outside the workspace. It uses only temporary files and deletes them afterward.

## Run it

```bash
git clone https://github.com/agent-util/agent-guard.git
cd agent-guard
npm ci
npm run demo
```

For a fast, unpaced verification:

```bash
npm run demo:quick
```

## Suggested narration

Use the paced command while recording a terminal window.

1. **0–10 seconds:** “Agent Guard is a policy and audit layer for supported AI-agent filesystem tools.”
2. **10–25 seconds:** Show the agent reading `src/app.ts`. Explain that ordinary work inside approved paths continues normally.
3. **25–45 seconds:** Show the `.env` attempt returning `DENIED_PATH`. Point out that the secret value never appears.
4. **45–65 seconds:** Show the MCP write targeting `../outside-workspace.txt`. Highlight `Underlying MCP handler called: NO`.
5. **65–80 seconds:** Show the redacted audit entries and explain that decisions include agent, operation, reason, session, and correlation metadata without file contents.
6. **80–90 seconds:** Close with: “Use Agent Guard with your agent’s native sandbox for defense in depth.”

## Expected result

```text
✅ ALLOW read src/app.ts
⛔ DENY read .env — reason: DENIED_PATH
⛔ DENY write ../outside-workspace.txt — reason: OUTSIDE_WORKSPACE
✅ Underlying MCP handler called: NO
```

The demo is an SDK/MCP enforcement demonstration. It does not claim to intercept arbitrary shell commands or unrelated processes.
