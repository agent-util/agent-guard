import { ProjectHookAdapter, type HookEvaluation } from "../hooks.js";
import type { AgentCapabilities } from "../../types/index.js";

export class CursorAdapter extends ProjectHookAdapter {
  readonly name = "cursor";
  readonly configRelativePath = ".cursor/hooks.json";
  capabilities(): AgentCapabilities {
    return { read: true, write: true, delete: false, execute: false, approval: true, auditing: true };
  }
  createConfig(command: string): unknown {
    return { version: 1, hooks: {
      preToolUse: [{ command, matcher: "Read|Write|Edit", failClosed: true }],
    } };
  }
  format(result: HookEvaluation): unknown {
    return { permission: result.decision, user_message: `Agent Guard: ${result.reason}`, agent_message: `Agent Guard policy: ${result.reason}` };
  }
}
export const cursorAdapter = new CursorAdapter();
