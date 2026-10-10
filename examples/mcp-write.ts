import { writeFile } from "node:fs/promises";
import { createAgentGuard, wrapMcpTool } from "../src/index.js";

const guard = createAgentGuard({
  workspace: process.cwd(),
  allowedPaths: ["src/**"],
  deniedPaths: [".env", ".env.*", "secrets/**"],
  policies: { write: "ask", outsideWorkspace: "deny" },
  audit: { enabled: true, redactSensitiveData: true },
  approvalHandler: async ({ request }) => {
    console.error(`Approve ${request.operation} ${request.path}? Denying in this example.`);
    return "deny";
  },
});

const writeFileTool = wrapMcpTool(
  guard,
  "my-mcp-server",
  { operation: "write", pathArgument: "path" },
  async ({ arguments: values }) => writeFile(String(values?.path), String(values?.content), "utf8"),
);

await writeFileTool({
  name: "write_file",
  arguments: { path: "src/generated.ts", content: "export const generated = true;\n" },
});
