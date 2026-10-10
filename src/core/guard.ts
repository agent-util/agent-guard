import { randomUUID } from "node:crypto";
import path from "node:path";
import type { GuardConfigInput, GuardConfig } from "../config/schema.js";
import { validateConfig } from "../config/schema.js";
import type { ApprovalHandler } from "./approvals.js";
import { ApprovalManager } from "./approvals.js";
import { AuditLogger } from "../audit/logger.js";
import type {
  AuditRecord,
  AuditFilter,
  EnforcementSource,
  EvaluationRequest,
  PolicyResult,
} from "../types/index.js";
import { GuardEventEmitter } from "./events.js";
import { PathResolver } from "./path-resolver.js";
import { PolicyEngine } from "./policy-engine.js";

export interface GuardOptions extends GuardConfigInput {
  approvalHandler?: ApprovalHandler;
}

export class AgentGuard extends GuardEventEmitter {
  readonly config: GuardConfig;
  readonly resolver: PathResolver;
  readonly policy: PolicyEngine;
  readonly approvals: ApprovalManager;
  readonly sessionId = randomUUID();
  private readonly audit?: AuditLogger;
  private started = false;

  constructor(options: GuardOptions) {
    super();
    const { approvalHandler, ...input } = options;
    this.config = validateConfig(input);
    this.resolver = new PathResolver(
      this.config.workspace,
      this.config.allowedPaths,
      this.config.deniedPaths,
    );
    this.policy = new PolicyEngine(this.config, this.resolver);
    this.approvals = new ApprovalManager(
      this.config.approval.timeoutMs,
      this.config.approval.tokenTtlMs,
      approvalHandler,
    );
    if (this.config.audit.enabled) {
      const file = path.resolve(this.config.workspace, this.config.audit.file);
      this.audit = new AuditLogger(
        file,
        this.config.audit.maxBytes,
        this.config.audit.retentionFiles,
        this.config.audit.redactSensitiveData,
      );
    }
  }
  async start(): Promise<void> {
    await this.resolver.resolve(".");
    this.started = true;
  }
  async stop(): Promise<void> {
    this.started = false;
    this.approvals.clear();
  }
  async evaluate(request: EvaluationRequest): Promise<PolicyResult> {
    return this.policy.evaluate(request);
  }

  async queryAudit(filter: AuditFilter = {}): Promise<AuditRecord[]> {
    return this.audit?.query(filter) ?? [];
  }

  async recordEvaluation(
    request: EvaluationRequest,
    result: PolicyResult,
    enforcement: EnforcementSource,
    correlationId = randomUUID(),
  ): Promise<AuditRecord> {
    const record: AuditRecord = {
      timestamp: new Date().toISOString(),
      ...request,
      decision: result.decision,
      reason: result.reason,
      enforcement,
      sessionId: this.sessionId,
      correlationId,
      policyVersion: this.config.policyVersion,
    };
    await this.audit?.write(record);
    this.emit("audit", record);
    if (result.decision === "deny") {
      this.emit("violation", record);
      this.emit("access-denied", record);
    }
    return record;
  }

  async authorize(
    request: EvaluationRequest,
    enforcement: EnforcementSource = "sdk",
  ): Promise<{ allowed: boolean; result: PolicyResult; correlationId: string }> {
    if (!this.started) await this.start();
    const correlationId = randomUUID();
    let result = await this.evaluate(request);
    if (result.decision === "ask") {
      this.emit("approval-required", { ...request, ...result, correlationId });
      const before = await this.resolver.fingerprint(request.path).catch(() => undefined);
      const token = await this.approvals.request(request, correlationId);
      const after = await this.resolver.fingerprint(request.path).catch(() => undefined);
      if (token && before === after && this.approvals.consume(token, request))
        result = { ...result, decision: "allow", reason: "APPROVED", requiresApproval: false };
      else result = { ...result, decision: "deny", requiresApproval: false };
    }
    try {
      await this.recordEvaluation(request, result, enforcement, correlationId);
    } catch {
      result = { ...result, decision: "deny", requiresApproval: false };
    }
    return { allowed: result.decision === "allow", result, correlationId };
  }
}

export function createAgentGuard(options: GuardOptions): AgentGuard {
  return new AgentGuard(options);
}
