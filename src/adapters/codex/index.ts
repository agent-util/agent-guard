import { ProjectHookAdapter, type HookEvaluation } from "../hooks.js";
import type { AgentCapabilities } from "../../types/index.js";

export class CodexAdapter extends ProjectHookAdapter {
  readonly name = "codex";
  readonly configRelativePath = ".codex/hooks.json";
  capabilities(): AgentCapabilities {
    return {
      read: false,
      write: true,
      delete: true,
      execute: false,
      approval: true,
      auditing: true,
    };
  }
  createConfig(command: string): unknown {
    return {
      hooks: {
        PreToolUse: [{ matcher: "apply_patch|Edit|Write", hooks: [{ type: "command", command }] }],
      },
    };
  }
  format(result: HookEvaluation): unknown {
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: result.decision,
        permissionDecisionReason: `Agent Guard: ${result.reason}`,
      },
    };
  }
}
export const codexAdapter = new CodexAdapter();
