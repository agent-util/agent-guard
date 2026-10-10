# Capability matrix

| Integration  |        Read |       Write |      Delete |     Execute |    Approval |       Audit | Scope                                        |
| ------------ | ----------: | ----------: | ----------: | ----------: | ----------: | ----------: | -------------------------------------------- |
| Node SDK     |         Yes |         Yes |         Yes |          No |         Yes |         Yes | Calls through `GuardedFs`                    |
| MCP wrapper  |         Yes |         Yes |         Yes |         Yes |         Yes |         Yes | Registered wrapped tools only                |
| Claude Code  |     Pending |     Pending |     Pending |     Pending |     Pending |     Pending | No unverified integration shipped            |
| Cursor       | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported | Does not override Cursor's sandbox           |
| OpenAI Codex | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported | Use Codex sandbox and approvals              |
| Watcher      |          No |          No |          No |          No |          No |         Yes | Audit-only changes; reads are not observable |

`Yes` means the integration has a code path capable of enforcing or recording that operation. It does not imply that unrelated processes or tools are covered.
