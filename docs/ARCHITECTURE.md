# Architecture

Agent Guard separates policy from enforcement. `PathResolver` canonicalizes an existing path or its nearest existing ancestor; `PolicyEngine` makes deterministic, side-effect-free decisions; `AgentGuard.authorize` handles approval, audit, and events; enforcement adapters decide whether an operation actually runs.

## Enforcement levels

| Level       |                                    Prevents access? | Scope                                                            |
| ----------- | --------------------------------------------------: | ---------------------------------------------------------------- |
| SDK         |                                                 Yes | Calls made through `GuardedFs`                                   |
| MCP wrapper |                                                 Yes | Registered, wrapped MCP tool calls                               |
| Agent hook  | Only where an official hook can cancel an operation | No verified vendor hooks are shipped in 0.1                      |
| OS sandbox  |                                                 Yes | Depends on external OS sandbox configuration; not installed here |
| Watcher     |                                                  No | Audit-only create/change/delete/rename-like events               |

Deny rules override allow rules. Outside-workspace resources are evaluated before operation or agent rules. Within the workspace the order is deny glob, allowed boundary, agent operation rule, global operation rule, default.

The package never monkey-patches unrelated processes and cannot constrain arbitrary shell commands. An integration must route an operation through the SDK or MCP wrapper to enforce it.

## TOCTOU

Reads and in-place writes use a verified file handle, reducing path-swap exposure. Creation, rename, and deletion still require pathname syscalls and therefore retain a time-of-check/time-of-use window. MCP handlers are revalidated but execute third-party code by path and have the same limitation. Strong isolation requires an OS sandbox, mount namespace, container, or platform-native handle-relative APIs.
