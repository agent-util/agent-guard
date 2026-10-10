# Threat model

## Protected assets

- Files outside the configured workspace
- Explicitly denied resources inside the workspace
- Integrity of policy and approval decisions
- Confidentiality of sensitive path names and file contents
- Audit-history integrity and decision traceability

## Considered threats

- Parent traversal and absolute-path bypasses
- Symlinked parents, missing leaves, and alternate representations
- Deny-glob and operation-policy precedence mistakes
- Missing or spoofed agent identities
- Approval timeout, replay, and cross-resource reuse
- Resource changes while a user is deciding
- Adapter, logger, or notification failures causing fail-open behavior
- Sensitive information leaking into audit records

## Trust boundaries

The host process, Agent Guard package, and configuration are trusted. A party able to modify those components can bypass SDK enforcement. Agent Guard assumes adapters accurately identify the calling agent and route every in-scope operation through the enforcing wrapper.

## Explicit exclusions

- Unwrapped filesystem calls and unrelated processes
- Kernel compromise or a privileged host attacker
- Arbitrary shell commands outside a wrapped integration
- Guaranteed read observation through filesystem watchers
- Reliable agent attribution from filesystem change events alone
- Complete elimination of races in path-based mutation syscalls

Use OS-native sandboxing, containers, or restricted service accounts when the agent process itself is not trusted.
