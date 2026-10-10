import type { AgentGuard } from "../../core/guard.js";
import type { FileOperation } from "../../types/index.js";

export interface McpToolCall {
  name: string;
  arguments?: Record<string, unknown>;
}
export type McpToolHandler<TResult = unknown> = (call: McpToolCall) => Promise<TResult>;
export interface McpToolRule {
  operation: FileOperation;
  pathArgument: string | string[];
}

export class McpAccessDeniedError extends Error {
  readonly code = "AGENT_GUARD_DENIED";
  constructor(readonly data: unknown, tool: string) {
    super(`Agent Guard denied MCP tool ${tool}`);
    this.name = "McpAccessDeniedError";
  }
}

export function wrapMcpTool<TResult>(
  guard: AgentGuard,
  agent: string,
  rule: McpToolRule,
  handler: McpToolHandler<TResult>,
): McpToolHandler<TResult> {
  return async (call) => {
    const names = Array.isArray(rule.pathArgument) ? rule.pathArgument : [rule.pathArgument];
    if (names.length === 0) throw new Error(`MCP tool ${call.name} has no protected paths`);
    for (const name of names) {
      const target = call.arguments?.[name];
      if (typeof target !== "string")
        throw new Error(`MCP tool ${call.name} requires string argument ${name}`);
      const authorization = await guard.authorize(
        { agent, operation: rule.operation, path: target },
        "mcp-wrapper",
      );
      if (!authorization.allowed) throw new McpAccessDeniedError(authorization.result, call.name);
      const before = await guard.resolver.resolve(target);
      if (before.canonicalPath !== authorization.result.resolvedPath)
        throw new McpAccessDeniedError({ reason: "RESOURCE_CHANGED" }, call.name);
    }
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
