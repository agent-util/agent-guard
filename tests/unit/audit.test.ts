import { mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createAgentGuard } from "../../src/index.js";
import { redactAuditRecord } from "../../src/audit/logger.js";
import type { AuditRecord } from "../../src/types/index.js";
const base: AuditRecord = {
  timestamp: new Date(0).toISOString(),
  agent: "a",
  operation: "read",
  path: "src/a.ts",
  decision: "allow",
  reason: "ALLOWED_PATH",
  enforcement: "sdk",
  sessionId: "s",
  correlationId: "c",
  policyVersion: "1",
};
const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
describe("audit redaction", () => {
  it("redacts sensitive paths without recording content", () => {
    expect(redactAuditRecord({ ...base, path: "secrets/api-key.txt" }).path).toBe(
      "[REDACTED]/sensitive-path",
    );
    expect(redactAuditRecord(base).path).toBe("src/a.ts");
  });
  it("filters structured records without reading file content", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "agent-guard-audit-"));
    roots.push(workspace);
    await mkdir(path.join(workspace, "src"));
    const guard = createAgentGuard({
      workspace,
      allowedPaths: ["src"],
      policies: { read: "allow", write: "deny" },
      audit: { enabled: true },
    });
    await guard.authorize({ agent: "alpha", operation: "read", path: "src/a.ts" });
    await guard.authorize({ agent: "beta", operation: "write", path: "src/a.ts" });
    const records = await guard.queryAudit({ agent: "beta", decision: "deny", limit: 1 });
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ agent: "beta", operation: "write", decision: "deny" });
    expect(JSON.stringify(records)).not.toContain("file content");
  });
});
