import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  ClaudeCodeAdapter,
  CodexAdapter,
  CursorAdapter,
  createAgentGuard,
  evaluateToolHook,
  extractHookRequests,
} from "../../src/index.js";

const roots: string[] = [];
async function workspace(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "agent-guard-hooks-"));
  roots.push(root);
  await mkdir(path.join(root, "src"));
  return root;
}
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("agent hooks", () => {
  it("extracts every target from a Codex patch", () => {
    expect(extractHookRequests("codex", {
      tool_name: "apply_patch",
      tool_input: { command: "*** Begin Patch\n*** Update File: src/a.ts\n*** Delete File: src/b.ts\n*** End Patch" },
    })).toEqual([
      { agent: "codex", operation: "write", path: "src/a.ts" },
      { agent: "codex", operation: "delete", path: "src/b.ts" },
    ]);
  });

  it("denies a vendor file tool before execution", async () => {
    const root = await workspace();
    const guard = createAgentGuard({
      workspace: root,
      allowedPaths: ["src"],
      policies: { write: "deny" },
      audit: { enabled: false },
    });
    await expect(evaluateToolHook(guard, "claude-code", {
      tool_name: "Write",
      tool_input: { file_path: path.join(root, "src/a.ts"), content: "secret-not-logged" },
    })).resolves.toMatchObject({ decision: "deny", reason: "OPERATION_POLICY" });
  });

  it("preserves ask so the host can show its native approval", async () => {
    const root = await workspace();
    const guard = createAgentGuard({
      workspace: root,
      allowedPaths: ["src"],
      policies: { write: "ask" },
      audit: { enabled: false },
    });
    await expect(evaluateToolHook(guard, "cursor", {
      tool_name: "Write", tool_input: { file_path: path.join(root, "src/a.ts") },
    })).resolves.toMatchObject({ decision: "ask" });
  });

  it.each([
    [ClaudeCodeAdapter, ".claude/settings.json", "PreToolUse"],
    [CursorAdapter, ".cursor/hooks.json", "preToolUse"],
    [CodexAdapter, ".codex/hooks.json", "PreToolUse"],
  ] as const)("installs and removes %p without deleting unrelated hooks", async (Adapter, relative, event) => {
    const root = await workspace();
    const target = path.join(root, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, JSON.stringify({ hooks: { SessionStart: [{ command: "keep-me" }] } }));
    const adapter = new Adapter(root);
    await adapter.install();
    const installed = JSON.parse(await readFile(target, "utf8")) as { hooks: Record<string, unknown[]> };
    expect(installed.hooks[event]).toHaveLength(1);
    expect(installed.hooks.SessionStart).toEqual([{ command: "keep-me" }]);
    await adapter.install();
    const idempotent = JSON.parse(await readFile(target, "utf8")) as { hooks: Record<string, unknown[]> };
    expect(idempotent.hooks[event]).toHaveLength(1);
    await adapter.uninstall();
    const removed = JSON.parse(await readFile(target, "utf8")) as { hooks: Record<string, unknown[]> };
    expect(removed.hooks[event]).toBeUndefined();
    expect(removed.hooks.SessionStart).toEqual([{ command: "keep-me" }]);
  });
});
