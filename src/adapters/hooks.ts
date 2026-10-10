import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AgentGuard } from "../core/guard.js";
import type { AgentAdapter, AgentCapabilities, EvaluationRequest, PolicyDecision } from "../types/index.js";

export interface ToolHookInput {
  hook_event_name?: string;
  tool_name?: string;
  tool_input?: unknown;
  file_path?: string;
  command?: string;
  cwd?: string;
}

export interface HookEvaluation {
  decision: PolicyDecision;
  reason: string;
}

const fileTools: Record<string, { operation: EvaluationRequest["operation"]; keys: string[] }> = {
  Read: { operation: "read", keys: ["file_path", "path"] },
  read_file: { operation: "read", keys: ["path", "file_path"] },
  Write: { operation: "write", keys: ["file_path", "path"] },
  Edit: { operation: "write", keys: ["file_path", "path"] },
  NotebookEdit: { operation: "write", keys: ["notebook_path", "file_path"] },
  write_file: { operation: "write", keys: ["path", "file_path"] },
  delete_file: { operation: "delete", keys: ["path", "file_path"] },
  move_file: { operation: "rename", keys: ["source", "destination", "from", "to"] },
};

function object(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try { return object(JSON.parse(value)); } catch { return {}; }
  }
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function patchRequests(command: string): EvaluationRequest[] {
  const requests: EvaluationRequest[] = [];
  const pattern = /^\*\*\* (Add|Update|Delete) File: (.+)$/gm;
  for (const match of command.matchAll(pattern)) {
    const action = match[1];
    const target = match[2];
    if (!target) continue;
    requests.push({
      agent: "codex",
      operation: action === "Add" ? "create" : action === "Delete" ? "delete" : "write",
      path: target,
    });
  }
  return requests;
}

export function extractHookRequests(agent: string, input: ToolHookInput): EvaluationRequest[] {
  if (input.file_path) return [{ agent, operation: "read", path: input.file_path }];
  const values = object(input.tool_input);
  const tool = input.tool_name ?? "";
  if (tool === "apply_patch") {
    const command = values.command;
    return typeof command === "string" ? patchRequests(command) : [];
  }
  if (tool === "Bash" || tool === "Shell") {
    const cwd = input.cwd ?? values.cwd;
    return typeof cwd === "string" ? [{ agent, operation: "execute", path: cwd }] : [];
  }
  const rule = fileTools[tool];
  if (!rule) return [];
  const paths = rule.keys.map((key) => values[key]).filter((value): value is string => typeof value === "string");
  return [...new Set(paths)].map((target) => ({ agent, operation: rule.operation, path: target }));
}

export async function evaluateToolHook(
  guard: AgentGuard,
  agent: string,
  input: ToolHookInput,
): Promise<HookEvaluation> {
  const requests = extractHookRequests(agent, input);
  if (requests.length === 0) return { decision: "allow", reason: "NO_FILESYSTEM_TARGET" };
  let outcome: HookEvaluation = { decision: "allow", reason: "ALLOWED_PATH" };
  for (const request of requests) {
    const result = await guard.evaluate(request);
    await guard.recordEvaluation(request, result, "agent-hook");
    if (result.decision === "deny") return { decision: "deny", reason: result.reason };
    if (result.decision === "ask") outcome = { decision: "ask", reason: result.reason };
  }
  return outcome;
}

export abstract class ProjectHookAdapter implements AgentAdapter {
  abstract readonly name: string;
  abstract readonly configRelativePath: string;
  abstract createConfig(command: string): unknown;
  abstract capabilities(): AgentCapabilities;
  constructor(readonly projectRoot = process.cwd()) {}
  async detect(): Promise<boolean> {
    return access(path.join(this.projectRoot, this.configRelativePath)).then(() => true, () => false);
  }
  async install(): Promise<void> {
    const target = path.join(this.projectRoot, this.configRelativePath);
    await mkdir(path.dirname(target), { recursive: true });
    let current: Record<string, unknown> = {};
    try { current = JSON.parse(await readFile(target, "utf8")) as Record<string, unknown>; } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const generated = this.createConfig(`agent-guard hook ${this.name}`) as Record<string, unknown>;
    const hooks = { ...object(current.hooks) };
    for (const [event, definitions] of Object.entries(object(generated.hooks))) {
      const existing: unknown[] = Array.isArray(hooks[event]) ? (hooks[event] as unknown[]) : [];
      const additions: unknown[] = Array.isArray(definitions) ? (definitions as unknown[]) : [];
      hooks[event] = [
        ...existing.filter((group) => !JSON.stringify(group).includes(`agent-guard hook ${this.name}`)),
        ...additions,
      ];
    }
    await writeFile(target, `${JSON.stringify({ ...current, ...generated, hooks }, null, 2)}\n`, { mode: 0o600 });
  }
  async uninstall(): Promise<void> {
    const target = path.join(this.projectRoot, this.configRelativePath);
    let current: Record<string, unknown>;
    try { current = JSON.parse(await readFile(target, "utf8")) as Record<string, unknown>; } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
    const hooks = object(current.hooks);
    for (const [event, definitions] of Object.entries(hooks)) {
      if (Array.isArray(definitions)) {
        const filtered = definitions.filter((group) => !JSON.stringify(group).includes(`agent-guard hook ${this.name}`));
        if (filtered.length) hooks[event] = filtered; else delete hooks[event];
      }
    }
    await writeFile(target, `${JSON.stringify({ ...current, hooks }, null, 2)}\n`, { mode: 0o600 });
  }
}
