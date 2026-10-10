# Configuration

Configuration is validated with Zod when a guard is created. Invalid values throw before enforcement starts.

```ts
const guard = createAgentGuard({
  workspace: process.cwd(),
  allowedPaths: ["src", "tests", "docs"],
  deniedPaths: [".env", ".env.*", "secrets/**"],
  policies: { read: "allow", write: "ask", outsideWorkspace: "deny" },
  agentPolicies: { "release-bot": { write: "deny" } },
  defaultDecision: "deny",
  approval: { timeoutMs: 30_000, defaultDecision: "deny", tokenTtlMs: 30_000 },
  audit: {
    enabled: true,
    redactSensitiveData: true,
    file: ".agent-guard/audit.jsonl",
    maxBytes: 5_000_000,
    retentionFiles: 5,
  },
  policyVersion: "1",
});
```

## Fields

| Field             | Type                     | Default                   | Description                                         |
| ----------------- | ------------------------ | ------------------------- | --------------------------------------------------- |
| `workspace`       | `string`                 | Required                  | Root against which relative resources are resolved. |
| `allowedPaths`    | `string[]`               | `["."]`                   | Allowed relative subtrees or glob patterns.         |
| `deniedPaths`     | `string[]`               | Sensitive defaults        | Higher-priority deny glob patterns.                 |
| `policies`        | `object`                 | Secure operation defaults | Global operation and outside-workspace decisions.   |
| `agentPolicies`   | `Record<string, object>` | `{}`                      | Per-agent operation overrides.                      |
| `defaultDecision` | `allow \| deny \| ask`   | `deny`                    | Decision for an unmatched in-workspace resource.    |
| `approval`        | `object`                 | Deny after 30 seconds     | Approval timeout and token lifetime.                |
| `audit`           | `object`                 | Enabled and redacted      | JSONL location, redaction, rotation, and retention. |
| `policyVersion`   | `string`                 | `"1"`                     | Version included in every audit record.             |

## Policy precedence

Evaluation is deterministic:

1. Reject invalid agent identities or unresolved paths.
2. Apply `outsideWorkspace` to canonical resources outside the workspace.
3. Apply matching deny patterns.
4. Require the resource to match an allowed path.
5. Apply an agent-specific operation rule.
6. Apply the global operation rule.
7. Use `defaultDecision`.

Deny patterns always override allowed paths.
