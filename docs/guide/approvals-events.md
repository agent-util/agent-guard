# Approvals and events

## Approval handler

An `ask` policy pauses an intercepted operation and invokes the configured trusted handler.

```ts
const guard = createAgentGuard({
  workspace: process.cwd(),
  policies: { write: "ask" },
  approval: {
    timeoutMs: 30_000,
    defaultDecision: "deny",
    tokenTtlMs: 30_000,
  },
  approvalHandler: async ({ request, correlationId, timeoutMs }) => {
    return showTrustedPrompt({ request, correlationId, timeoutMs });
  },
});
```

The handler returns `"allow-once"`, `"allow-session"`, or `"deny"`. Missing handlers, exceptions, and timeouts deny the operation. Approval grants are bound to the exact agent, operation, and path, expire, and cannot be replayed.

## Events

```ts
guard.on("violation", (event) => reportViolation(event));
guard.on("approval-required", (request) => displayApproval(request));
guard.on("access-denied", (event) => warnUser(event));
guard.on("audit", (record) => collectMetric(record));
```

Do not attach notification handlers that export filesystem paths or audit records to remote services without explicit user opt-in. Webhook notifications omit paths by default.
