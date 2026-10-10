# MCP tool protection

Use MCP wrappers around every filesystem-capable tool that must be governed. Unknown tools are rejected by `wrapMcpTools` when they have no registered rule.

```ts
import { createAgentGuard, wrapMcpTools } from "@agent-utils/agent-guard";

const guard = createAgentGuard({
  workspace: process.cwd(),
  allowedPaths: ["src", "tests"],
  policies: { read: "allow", write: "ask", delete: "deny" },
});

const protectedHandler = wrapMcpTools(
  guard,
  "mcp-client",
  {
    read_file: { operation: "read", pathArgument: "path" },
    write_file: { operation: "write", pathArgument: "path" },
    delete_file: { operation: "delete", pathArgument: "path" },
  },
  async (call) => executeRegisteredTool(call),
);
```

The wrapper:

1. Validates the configured path argument.
2. Authorizes the operation using the MCP agent identity.
3. Handles approval when the decision is `ask`.
4. Revalidates the canonical resource.
5. Calls the underlying handler only when allowed.

::: warning Scope
MCP wrapping protects only calls routed through the wrapper. It does not restrict shell commands, other MCP servers, unwrapped tools, or unrelated processes.
:::
