import type { AgentGuard } from "../../core/guard.js";
import type { FileOperation } from "../../types/index.js";

export interface McpToolCall {
  name: string;
  arguments?: Record<string, unknown>;
}
export type McpToolHandler<TResult = unknown> = (call: McpToolCall) => Promise<TResult>;
export interface McpToolRule {
  operation: FileOperation;
  pathArgument: string;
}

export function wrapMcpTool<TResult>(
  guard: AgentGuard,
  agent: string,
  rule: McpToolRule,
  handler: McpToolHandler<TResult>,
): McpToolHandler<TResult> {
  return async (call) => {
    const target = call.arguments?.[rule.pathArgument];
    if (typeof target !== "string")
      throw new Error(`MCP tool ${call.name} requires string argument ${rule.pathArgument}`);
    const authorization = await guard.authorize(
      { agent, operation: rule.operation, path: target },
      "mcp-wrapper",
    );
    if (!authorization.allowed)
      throw Object.assign(
        new Error(`Agent Guard denied MCP tool ${call.name}: ${authorization.result.reason}`),
        { code: "AGENT_GUARD_DENIED", data: authorization.result },
      );
    const before = await guard.resolver.resolve(target);
    if (before.canonicalPath !== authorization.result.resolvedPath)
      throw new Error("Resource changed after policy evaluation");
    return handler(call);
  };
}

export function wrapMcpTools<TResult>(
  guard: AgentGuard,
  agent: string,
  rules: Record<string, McpToolRule>,
  handler: McpToolHandler<TResult>,
): McpToolHandler<TResult> {
  return async (call) => {
    const rule = rules[call.name];
    if (!rule) throw new Error(`Unprotected MCP tool rejected: ${call.name}`);
    return wrapMcpTool(guard, agent, rule, handler)(call);
  };
}
