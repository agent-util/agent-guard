# Getting started

## Requirements

- Node.js 20 or newer
- An operation routed through the Node SDK or MCP wrapper

## Installation

```bash
npm install @agent-utils/agent-guard
```

## Create a guard

```ts
import { createAgentGuard } from "@agent-utils/agent-guard";

const guard = createAgentGuard({
  workspace: process.cwd(),
  allowedPaths: ["src", "tests", "docs"],
  deniedPaths: [".env", ".env.*", "secrets/**", "~/.ssh/**"],
  policies: {
    read: "allow",
    write: "ask",
    create: "ask",
    delete: "deny",
    rename: "ask",
    execute: "deny",
    outsideWorkspace: "deny",
  },
  audit: {
    enabled: true,
    redactSensitiveData: true,
  },
});

await guard.start();
```

## Evaluate without executing

`evaluate()` is deterministic and side-effect free. It is useful for policy tests and previews, but it does not enforce access by itself.

```ts
const result = await guard.evaluate({
  agent: "my-agent",
  operation: "write",
  path: "../private/config.json",
});

// {
//   decision: "deny",
//   reason: "OUTSIDE_WORKSPACE",
//   requiresApproval: false
// }
```

## Enforce an operation

Route filesystem work through `GuardedFs`:

```ts
import { createGuardedFs } from "@agent-utils/agent-guard";

const fs = createGuardedFs(guard, "my-agent");
const source = await fs.readFile("src/index.ts");
```

Denied calls reject with `AccessDeniedError` before the wrapped operation runs.

## Listen for decisions

```ts
guard.on("access-denied", (event) => console.warn("Blocked", event));
guard.on("approval-required", (request) => console.log("Needs review", request));
```

Next, read the [Node.js agent guide](./node-agents) or [MCP guide](./mcp).
