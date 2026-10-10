# Capability matrix

| Integration  |        Read |       Write |      Delete |     Execute |    Approval |       Audit | Scope                                        |
| ------------ | ----------: | ----------: | ----------: | ----------: | ----------: | ----------: | -------------------------------------------- |
| Node SDK     |         Yes |         Yes |         Yes |          No |         Yes |         Yes | Calls through `GuardedFs`                    |
| MCP wrapper  |         Yes |         Yes |         Yes |         Yes |         Yes |         Yes | Registered wrapped tools only                |
| Claude Code  |         Yes |         Yes |          No |          No |         Yes |         Yes | Matched `PreToolUse` direct file tools only  |
| Cursor       |         Yes |         Yes |          No |          No |         Yes |         Yes | Matched `preToolUse` direct file tools only  |
| OpenAI Codex |          No |         Yes |         Yes |          No |         Yes |         Yes | `apply_patch` through local project hooks    |
| Watcher      |          No |          No |          No |          No |          No |         Yes | Audit-only changes; reads are not observable |

`Yes` means the integration has a code path capable of enforcing or recording that operation. It does not imply that unrelated processes or tools are covered.

Shell commands are deliberately not counted. A pre-shell hook can approve or reject a command, but approval does not constrain the command's downstream filesystem effects. Codex's sandbox, Cursor's run mode, and Claude Code's native permissions remain separate and should stay enabled.
