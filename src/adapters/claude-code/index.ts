import { ProjectHookAdapter, type HookEvaluation } from "../hooks.js";
import type { AgentCapabilities } from "../../types/index.js";

export class ClaudeCodeAdapter extends ProjectHookAdapter {
  readonly name = "claude-code";
  readonly configRelativePath = ".claude/settings.json";
  capabilities(): AgentCapabilities {
    return { read: true, write: true, delete: false, execute: false, approval: true, auditing: true };
  }
  createConfig(command: string): unknown {
    return { hooks: { PreToolUse: [{ matcher: "Read|Write|Edit|NotebookEdit", hooks: [{ type: "command", command }] }] } };
  }
  format(result: HookEvaluation): unknown {
    return { hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: result.decision, permissionDecisionReason: `Agent Guard: ${result.reason}` } };
  }
}
export const claudeCodeAdapter = new ClaudeCodeAdapter();
