import { mkdir, mkdtemp, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import { createAgentGuard, normalizeWindowsPathForTesting } from "../../src/index.js";

const roots: string[] = [];
async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-guard-"));
  roots.push(root);
  const workspace = path.join(root, "workspace");
  const privateDir = path.join(root, "private");
  await mkdir(path.join(workspace, "src"), { recursive: true });
  await mkdir(privateDir);
  await writeFile(path.join(workspace, "src", "index.ts"), "ok");
  await writeFile(path.join(workspace, ".env"), "SECRET=x");
  await writeFile(path.join(privateDir, "secret"), "no");
  return { root, workspace, privateDir };
}
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("policy precedence and paths", () => {
  it("allows configured nested paths", async () => {
    const { workspace } = await fixture();
    const guard = createAgentGuard({
      workspace,
      allowedPaths: ["src"],
      policies: { read: "allow" },
      audit: { enabled: false },
    });
    expect(
      (await guard.evaluate({ agent: "test", operation: "read", path: "src/index.ts" })).decision,
    ).toBe("allow");
  });
  it("denies paths not in allowed paths", async () => {
    const { workspace } = await fixture();
    const guard = createAgentGuard({
      workspace,
      allowedPaths: ["src"],
      defaultDecision: "deny",
      audit: { enabled: false },
    });
    expect(
      (await guard.evaluate({ agent: "test", operation: "read", path: ".env" })).decision,
    ).toBe("deny");
  });
  it.each(["../private/secret", "src/../../../private/secret"])(
    "denies traversal: %s",
    async (target) => {
      const { workspace } = await fixture();
      const guard = createAgentGuard({ workspace, audit: { enabled: false } });
      const result = await guard.evaluate({ agent: "test", operation: "read", path: target });
      expect(result).toMatchObject({ decision: "deny", reason: "OUTSIDE_WORKSPACE" });
    },
  );
  it("denies absolute outside paths", async () => {
    const { workspace, privateDir } = await fixture();
    const guard = createAgentGuard({ workspace, audit: { enabled: false } });
    expect(
      (
        await guard.evaluate({
          agent: "test",
          operation: "read",
          path: path.join(privateDir, "secret"),
        })
      ).decision,
    ).toBe("deny");
  });
  it("denies symlink escapes including missing leaves", async () => {
    const { workspace, privateDir } = await fixture();
    await symlink(privateDir, path.join(workspace, "src", "linked"));
    const guard = createAgentGuard({
      workspace,
      allowedPaths: ["src/**"],
      audit: { enabled: false },
    });
    for (const target of ["src/linked/secret", "src/linked/new-file"])
      expect(
        (await guard.evaluate({ agent: "test", operation: "read", path: target })).reason,
      ).toBe("OUTSIDE_WORKSPACE");
  });
  it("applies deny glob before allow", async () => {
    const { workspace } = await fixture();
    const guard = createAgentGuard({
      workspace,
      allowedPaths: ["**"],
      deniedPaths: [".env*"],
      policies: { read: "allow" },
      audit: { enabled: false },
    });
    expect(await guard.evaluate({ agent: "test", operation: "read", path: ".env" })).toMatchObject({
      decision: "deny",
      reason: "DENIED_PATH",
    });
  });
  it("applies agent rule before operation rule", async () => {
    const { workspace } = await fixture();
    const guard = createAgentGuard({
      workspace,
      allowedPaths: ["src"],
      policies: { write: "allow" },
      agentPolicies: { risky: { write: "deny" } },
      audit: { enabled: false },
    });
    expect(
      await guard.evaluate({ agent: "risky", operation: "write", path: "src/index.ts" }),
    ).toMatchObject({ decision: "deny", reason: "AGENT_POLICY" });
  });
  it("rejects missing agent identity", async () => {
    const { workspace } = await fixture();
    const guard = createAgentGuard({ workspace, audit: { enabled: false } });
    expect((await guard.evaluate({ agent: " ", operation: "read", path: "." })).reason).toBe(
      "INVALID_REQUEST",
    );
  });
  it("normalizes Windows drive case and traversal", () => {
    expect(normalizeWindowsPathForTesting("c:\\work\\src\\..\\file")).toBe("C:\\work\\file");
  });
});
