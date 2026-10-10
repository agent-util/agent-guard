# Security guarantees versus limitations

Agent Guard provides deterministic enforcement only for operations routed through a supported wrapper or blocking hook. It is not a universal operating-system sandbox.

![Agent Guard security guarantees and limitations](/security-boundary.svg)

| Agent Guard guarantees                             | Agent Guard does not guarantee                            |
| -------------------------------------------------- | --------------------------------------------------------- |
| Canonical path evaluation for supported operations | Interception of unrelated processes                       |
| Deny rules take precedence over allow rules        | Confinement of an approved shell command                  |
| Denied wrapped handlers are not invoked            | Coverage for host tools that bypass local hooks           |
| Approval grants bind to agent, operation, and path | Tamper resistance when an attacker controls configuration |
| Audit records omit file contents                   | Perfect attribution from audit-only filesystem events     |
| Sensitive-looking audit paths are redacted         | Elimination of every path mutation race                   |

## Recommended deployment

Use four layers together:

1. **Native agent controls:** keep Claude Code permissions, Cursor run modes, and Codex sandboxing enabled.
2. **Agent Guard:** apply project-specific paths, operation policies, approvals, and audit records.
3. **Process isolation:** use a container, VM, or restricted OS account for untrusted autonomous workloads.
4. **Repository controls:** require reviewed pull requests, secret scanning, and protected branches.

The [threat-model article](/articles/threat-model) explains the reasoning and remaining risks in detail.
