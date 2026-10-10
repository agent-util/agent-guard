# Node.js agents

`GuardedFs` provides enforcing wrappers for common filesystem operations. The agent identity is required and becomes part of policy evaluation, approvals, and audit records.

```ts
import { createAgentGuard, createGuardedFs } from "@agent-utils/agent-guard";

const guard = createAgentGuard({
  workspace: process.cwd(),
  allowedPaths: ["workspace"],
  policies: { read: "allow", write: "ask", delete: "deny" },
});

const fs = createGuardedFs(guard, "custom-node-agent");

await fs.readFile("workspace/input.txt");
await fs.writeFile("workspace/output.txt", "updated");
await fs.createFile("workspace/new.txt", "created");
await fs.rename("workspace/new.txt", "workspace/final.txt");
await fs.delete("workspace/final.txt");
```

## Handle denials

```ts
import { AccessDeniedError } from "@agent-utils/agent-guard";

try {
  await fs.delete("workspace/important.txt");
} catch (error) {
  if (error instanceof AccessDeniedError) {
    console.error(error.request.operation, error.request.path, error.reason);
  }
}
```

Reads and in-place writes use verified handles. Creation, rename, and deletion ultimately rely on path-based Node.js syscalls and retain a time-of-check/time-of-use window. Use an OS sandbox when the agent process itself is not trusted.
