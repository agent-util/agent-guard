import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createAgentGuard, createGuardedFs, wrapMcpTool } from "../dist/index.js";

const presenting = process.argv.includes("--present");
const pause = (/** @type {number} */ milliseconds) =>
  presenting ? new Promise((resolve) => setTimeout(resolve, milliseconds)) : Promise.resolve();
const step = async (title, detail, delay = 15_000) => {
  console.log(`\n▶ ${title}\n  ${detail}`);
  await pause(delay);
};

const workspace = await mkdtemp(path.join(os.tmpdir(), "agent-guard-demo-"));
let outsideHandlerCalled = false;

try {
  await mkdir(path.join(workspace, "src"));
  await writeFile(path.join(workspace, "src", "app.ts"), "export const status = 'safe';\n");
  await writeFile(path.join(workspace, ".env"), "DEMO_SECRET=never-print-this\n");

  console.log("\n🛡️  Agent Guard — 60–90 second security demo");
  console.log(`   Temporary workspace: ${workspace}`);

  const guard = createAgentGuard({
    workspace,
    allowedPaths: ["src/**"],
    deniedPaths: [".env", ".env.*", "secrets/**"],
    policies: {
      read: "allow",
      write: "ask",
      create: "ask",
      delete: "deny",
      rename: "ask",
      execute: "deny",
      outsideWorkspace: "deny",
    },
    audit: { enabled: true, redactSensitiveData: true },
  });
  const guardedFs = createGuardedFs(guard, "demo-agent");

  await step("1. Normal work stays productive", "The agent reads src/app.ts through GuardedFs.");
  const source = await guardedFs.readFile("src/app.ts");
  console.log(`  ✅ ALLOW read src/app.ts (${source.length} bytes)`);

  await step("2. Secret access is blocked", "The same agent attempts to read .env.");
  try {
    await guardedFs.readFile(".env");
    throw new Error("Demo invariant failed: .env was unexpectedly readable");
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("Agent Guard denied")) throw error;
    console.log("  ⛔ DENY read .env — reason: DENIED_PATH");
    console.log("  🔒 The secret value was never returned or printed.");
  }

  await step(
    "3. Workspace escape is blocked",
    "An MCP write tool attempts to target ../outside-workspace.txt.",
  );
  const guardedWrite = wrapMcpTool(
    guard,
    "demo-mcp-agent",
    { operation: "write", pathArgument: "path" },
    async () => {
      outsideHandlerCalled = true;
    },
  );
  try {
    await guardedWrite({
      name: "write_file",
      arguments: { path: "../outside-workspace.txt", content: "should never be written" },
    });
    throw new Error("Demo invariant failed: outside write was unexpectedly allowed");
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("Agent Guard denied")) throw error;
    console.log("  ⛔ DENY write ../outside-workspace.txt — reason: OUTSIDE_WORKSPACE");
    console.log(`  ✅ Underlying MCP handler called: ${outsideHandlerCalled ? "YES" : "NO"}`);
  }

  await step(
    "4. Every enforced decision is auditable",
    "The log stores policy metadata, never file contents; sensitive paths are redacted.",
  );
  const audit = await guard.queryAudit();
  for (const record of audit) {
    console.log(
      `  ${record.decision.toUpperCase().padEnd(5)} ${record.operation.padEnd(5)} ${record.path}`,
    );
  }

  if (outsideHandlerCalled) throw new Error("Demo invariant failed: denied MCP handler executed");
  console.log(
    "\n✅ Demo complete: safe work allowed, secret read denied, workspace escape blocked.\n",
  );
} finally {
  await rm(workspace, { recursive: true, force: true });
}
