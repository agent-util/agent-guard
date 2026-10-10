import { describe, expect, it } from "vitest";
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
describe("audit redaction", () => {
  it("redacts sensitive paths without recording content", () => {
    expect(redactAuditRecord({ ...base, path: "secrets/api-key.txt" }).path).toBe(
      "[REDACTED]/sensitive-path",
    );
    expect(redactAuditRecord(base).path).toBe("src/a.ts");
  });
});
