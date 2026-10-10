# API reference

## `createAgentGuard(options)`

Creates an `AgentGuard`. Call `start()` to validate the workspace eagerly; authorization also starts it lazily.

## `guard.evaluate(request)`

Returns a `PolicyResult` without approval, audit, notification, or filesystem side effects.

```ts
interface EvaluationRequest {
  agent: string;
  operation: "read" | "write" | "create" | "delete" | "rename" | "execute";
  path: string;
}

interface PolicyResult {
  decision: "allow" | "deny" | "ask";
  reason: ReasonCode;
  requiresApproval: boolean;
  resolvedPath?: string;
}
```

## `guard.authorize(request, enforcement?)`

Evaluates, requests approval when necessary, writes the audit record, and emits typed events. It returns `{ allowed, result, correlationId }`. The caller must execute an operation only when `allowed` is true.

## `createGuardedFs(guard, agent)`

Returns enforcing `readFile`, `writeFile`, `createFile`, `delete`, and `rename` methods. A denial throws `AccessDeniedError`.

## `wrapMcpTool()` and `wrapMcpTools()`

Wrap one tool or a named tool registry. Each rule maps a tool name to an operation and string path argument.

## Policy utilities

- `validateConfig(value)` validates and applies defaults.
- `testPolicy(config, requests)` evaluates multiple requests without executing operations.
- `PathResolver` exposes canonical path and resource fingerprint utilities.

## Monitoring and notifications

- `AuditWatcher` reports debounced filesystem changes as `audit-only` events.
- `terminalNotifier()` formats audit decisions for a stream.
- `webhookNotifier()` creates an explicitly enabled JSON webhook sender.
- `desktopNotifier()` delegates to a supplied platform adapter.

The package exports TypeScript declarations for all public request, result, event, adapter, and configuration types.
