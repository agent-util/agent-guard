# Agent integrations

Agent Guard can install project-level blocking hooks for direct filesystem tools. Create `agent-guard.config.json` first, then run one or more installers:

```bash
agent-guard adapters install claude-code
agent-guard adapters install cursor
agent-guard adapters install codex
```

Installation is idempotent and preserves unrelated hook entries. Uninstall removes only entries containing the corresponding Agent Guard command.

## Claude Code

The adapter writes `.claude/settings.json` and uses the documented `PreToolUse` response (`allow`, `deny`, or `ask`) for `Read`, `Write`, `Edit`, and `NotebookEdit`. See the [Claude Code hooks reference](https://code.claude.com/docs/en/hooks).

## Cursor

The adapter writes `.cursor/hooks.json`, enables `failClosed`, and gates direct `Read`, `Write`, and `Edit` calls through `preToolUse`. Cursor project hooks require a trusted workspace. Cursor Cloud does not run hooks during its early read-only exploration. See the [Cursor hooks reference](https://cursor.com/docs/hooks).

## OpenAI Codex

The adapter writes `.codex/hooks.json` and gates paths declared by `apply_patch`. It never disables or bypasses Codex sandboxing or approvals. Project hooks load only for trusted projects, and some specialized or hosted tool paths are outside the local hook mechanism. See the [Codex hooks documentation](https://developers.openai.com/docs/hooks).

## Security boundary

These adapters do not parse or constrain arbitrary shell commands. A command approved for execution could access files using another program, so native sandbox controls remain necessary. A hook output of `ask` delegates the final prompt to the host; Agent Guard records the policy decision but cannot observe the user's final host-native choice.
