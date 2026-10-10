# Copy-paste integrations

Start every integration from your project root:

```bash
npm install --save-dev @agent-utils/agent-guard
npx agent-guard init
```

Review `agent-guard.config.json` before enabling an adapter. The generated defaults allow `src`, `tests`, and `docs`, deny common secret paths, ask before writes, and deny deletion, execution, and outside-workspace access.

## MCP filesystem tool

```ts
import { writeFile } from "node:fs/promises";
import { createAgentGuard, wrapMcpTool } from "@agent-utils/agent-guard";

const guard = createAgentGuard({
  workspace: process.cwd(),
  allowedPaths: ["src/**"],
  deniedPaths: [".env", ".env.*", "secrets/**"],
  policies: { write: "ask", outsideWorkspace: "deny" },
  approvalHandler: async () => "deny", // Replace with your trusted approval UI.
});

export const guardedWrite = wrapMcpTool(
  guard,
  "my-mcp-server",
  { operation: "write", pathArgument: "path" },
  async ({ arguments: args }) => writeFile(String(args?.path), String(args?.content), "utf8"),
);
```

Every filesystem-capable MCP tool must be wrapped. This does not restrict unrelated agent or shell tools.

## Claude Code

```bash
npx agent-guard adapters install claude-code
git add agent-guard.config.json .claude/settings.json
```

Coverage: direct `Read`, `Write`, `Edit`, and `NotebookEdit` calls through the documented `PreToolUse` hook.

## Cursor

```bash
npx agent-guard adapters install cursor
git add agent-guard.config.json .cursor/hooks.json
```

Coverage: direct `Read`, `Write`, and `Edit` calls through a fail-closed `preToolUse` project hook. Open the repository as a trusted workspace.

## OpenAI Codex

```bash
npx agent-guard adapters install codex
git add agent-guard.config.json .codex/hooks.json
```

Coverage: paths declared by `apply_patch` through the documented `PreToolUse` hook. Accept the project-hook trust prompt and retain Codex sandboxing.

## Verify installation

```bash
npx agent-guard policy validate
npx agent-guard adapters list
npx agent-guard check src/index.ts --operation read
npx agent-guard check ../outside.txt --operation write
```

Expected exit codes are `0` for allow, `1` for deny, and `2` for ask.
