import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createAgentGuard, createGuardedFs, wrapMcpTool } from "../../src/index.js";
const roots: string[] = [];
async function setup() {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "agent-guard-int-"));
  roots.push(workspace);
  await mkdir(path.join(workspace, "src"));
  await writeFile(path.join(workspace, "src", "a.txt"), "old");
  return workspace;
}
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
describe("enforcement wrappers", () => {
  it("prevents a denied Node operation", async () => {
    const workspace = await setup();
    const guard = createAgentGuard({
      workspace,
      allowedPaths: ["src"],
      policies: { write: "deny" },
      audit: { enabled: false },
    });
    const fs = createGuardedFs(guard, "custom");
    await expect(fs.writeFile("src/a.txt", "new")).rejects.toMatchObject({
      code: "AGENT_GUARD_DENIED",
    });
    expect(await readFile(path.join(workspace, "src/a.txt"), "utf8")).toBe("old");
  });
  it("executes an allowed Node read", async () => {
    const workspace = await setup();
    const guard = createAgentGuard({
      workspace,
      allowedPaths: ["src"],
      policies: { read: "allow" },
      audit: { enabled: false },
    });
    expect(await createGuardedFs(guard, "custom").readFile("src/a.txt")).toBe("old");
  });
  it("blocks MCP handler invocation", async () => {
    const workspace = await setup();
    const guard = createAgentGuard({
      workspace,
      policies: { delete: "deny" },
      audit: { enabled: false },
    });
    let called = false;
    const wrapped = wrapMcpTool(
      guard,
      "mcp",
      { operation: "delete", pathArgument: "path" },
      async () => {
        called = true;
      },
    );
    await expect(
      wrapped({ name: "delete_file", arguments: { path: "src/a.txt" } }),
    ).rejects.toMatchObject({ code: "AGENT_GUARD_DENIED" });
    expect(called).toBe(false);
  });
  it("fails closed if audit storage cannot be written", async () => {
    const workspace = await setup();
    const guard = createAgentGuard({
      workspace,
      allowedPaths: ["src"],
      policies: { read: "allow" },
      audit: { enabled: true, file: "src/a.txt/audit.jsonl" },
    });
    expect(
      (await guard.authorize({ agent: "a", operation: "read", path: "src/a.txt" })).allowed,
    ).toBe(false);
  });
});
