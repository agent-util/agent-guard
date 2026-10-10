import { rename } from "node:fs/promises";
import { createAgentGuard, wrapMcpTool } from "../src/index.js";

const guard = createAgentGuard({
  workspace: process.cwd(),
  allowedPaths: ["src"],
  policies: { rename: "ask", outsideWorkspace: "deny" },
  approvalHandler: async () => "allow-once",
});

const moveFile = wrapMcpTool(
  guard,
  "example-mcp-server",
  { operation: "rename", pathArgument: ["from", "to"] },
  async ({ arguments: values }) => rename(String(values?.from), String(values?.to)),
);

await moveFile({ name: "move_file", arguments: { from: "src/old.ts", to: "src/new.ts" } });
