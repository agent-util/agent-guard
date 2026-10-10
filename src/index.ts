export { createAgentGuard, AgentGuard } from "./core/guard.js";
export type { GuardOptions } from "./core/guard.js";
export { PathResolver, normalizeWindowsPathForTesting } from "./core/path-resolver.js";
export { PolicyEngine, testPolicy } from "./core/policy-engine.js";
export { ApprovalManager } from "./core/approvals.js";
export type { ApprovalHandler, ApprovalPrompt } from "./core/approvals.js";
export { createGuardedFs, GuardedFs, AccessDeniedError } from "./adapters/node/index.js";
export { wrapMcpTool, wrapMcpTools } from "./adapters/mcp/index.js";
export type { McpToolCall, McpToolHandler, McpToolRule } from "./adapters/mcp/index.js";
export {
  claudeCodeAdapter,
  cursorAdapter,
  codexAdapter,
  PendingDocumentedAdapter,
} from "./adapters/pending.js";
export { AuditWatcher } from "./monitoring/watcher.js";
export { terminalNotifier } from "./notifications/terminal.js";
export { webhookNotifier } from "./notifications/webhook.js";
export { desktopNotifier } from "./notifications/desktop.js";
export type { DesktopNotificationAdapter } from "./notifications/desktop.js";
export {
  validateConfig,
  guardConfigSchema,
  decisionSchema,
  operationSchema,
} from "./config/schema.js";
export type { GuardConfig, GuardConfigInput } from "./config/schema.js";
export type * from "./types/index.js";
