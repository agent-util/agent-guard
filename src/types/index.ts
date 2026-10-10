export type FileOperation = "read" | "write" | "create" | "delete" | "rename" | "execute";
export type PolicyDecision = "allow" | "deny" | "ask";
export type ReasonCode =
  | "ALLOWED_PATH"
  | "DENIED_PATH"
  | "OUTSIDE_WORKSPACE"
  | "OPERATION_POLICY"
  | "AGENT_POLICY"
  | "UNRESOLVED_PATH"
  | "INVALID_REQUEST"
  | "APPROVED";
export type EnforcementSource = "sdk" | "agent-hook" | "mcp-wrapper" | "os-sandbox" | "audit-only";

export interface EvaluationRequest {
  agent: string;
  operation: FileOperation;
  path: string;
}
export interface PolicyResult {
  decision: PolicyDecision;
  reason: ReasonCode;
  requiresApproval: boolean;
  resolvedPath?: string;
}
export interface AuditRecord extends EvaluationRequest {
  timestamp: string;
  decision: PolicyDecision;
  reason: ReasonCode;
  enforcement: EnforcementSource;
  sessionId: string;
  correlationId: string;
  policyVersion: string;
}
export interface AgentCapabilities {
  read: boolean;
  write: boolean;
  delete: boolean;
  execute: boolean;
  approval: boolean;
  auditing: boolean;
}
export interface AgentAdapter {
  readonly name: string;
  detect(): Promise<boolean>;
  capabilities(): AgentCapabilities;
  install(): Promise<void>;
  uninstall(): Promise<void>;
}
