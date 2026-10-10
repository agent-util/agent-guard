# Introduction

Agent Guard is a policy and enforcement toolkit for developers building AI coding agents, MCP servers, and agent-facing filesystem tools. It answers three questions for each supported operation:

1. Is the resource inside the configured workspace and allowed path set?
2. What deterministic policy applies to this agent and operation?
3. Can the enforcing integration proceed, deny, or pause for approval?

## Enforcement levels

Agent Guard intentionally separates four different security claims:

| Level                         | What it means                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| SDK enforcement               | Calls made through `GuardedFs` are checked before execution.                                      |
| Agent integration enforcement | A supported hook or wrapped tool checks an operation before the host executes it.                 |
| OS sandbox enforcement        | The operating system constrains the process independently of Agent Guard.                         |
| Audit-only monitoring         | A change is observed, but it is not prevented and cannot automatically be attributed to an agent. |

Only the first two are implemented by this package. Agent Guard does not monkey-patch unrelated Node.js processes, intercept arbitrary shell commands, or replace host-agent sandboxes.

## Core flow

```text
request → canonical path resolution → boundary checks → deny globs
        → agent/operation policy → optional approval → revalidation
        → audit and events → enforcing adapter executes or rejects
```

Continue with [Getting started](./getting-started) to protect your first filesystem operation.
