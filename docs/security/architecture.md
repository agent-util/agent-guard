# Security architecture

Agent Guard separates decision-making from enforcement:

1. `PathResolver` resolves the requested path against the workspace and canonicalizes existing ancestors.
2. `PolicyEngine` produces a deterministic, side-effect-free decision.
3. `AgentGuard.authorize()` handles approval, audit storage, and typed events.
4. An enforcing adapter executes only an allowed operation.

## Path handling

The resolver normalizes relative and absolute inputs, canonicalizes the workspace, and resolves a missing leaf through its nearest existing ancestor. This prevents ordinary `..` traversal and symlinked-parent escapes. Paths containing null bytes and paths that cannot be resolved safely fail closed.

Both relative and canonical absolute representations are checked against deny globs. Outside-workspace checks run before operation policies, and deny matches run before allowed-path matches.

## Approval binding

Approval grants contain a cryptographically random token bound to the agent identity, operation, and resource. Tokens expire, are single-use, and are consumed with timing-safe binding comparison. Agent Guard fingerprints and revalidates the resource around approval.

## Audit handling

Audit records contain decisions and metadata, never file contents. Sensitive path names are redacted by default. JSONL files use restrictive creation permissions, size-based rotation, configurable retention, session identifiers, correlation IDs, policy versions, and enforcement sources.

For implementation-level detail, see the repository's canonical [architecture document](https://github.com/agent-util/agent-guard/blob/main/docs/ARCHITECTURE.md).
