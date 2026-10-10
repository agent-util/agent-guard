import type { GuardConfig } from "../config/schema.js";
import type {
  EvaluationRequest,
  FileOperation,
  PolicyDecision,
  PolicyResult,
} from "../types/index.js";
import { PathResolver } from "./path-resolver.js";

const fallbackPolicies: Record<FileOperation, PolicyDecision> = {
  read: "allow",
  write: "ask",
  create: "ask",
  delete: "deny",
  rename: "ask",
  execute: "deny",
};

export class PolicyEngine {
  constructor(
    private readonly config: GuardConfig,
    private readonly resolver: PathResolver,
  ) {}

  async evaluate(request: EvaluationRequest): Promise<PolicyResult> {
    if (!request.agent.trim())
      return { decision: "deny", reason: "INVALID_REQUEST", requiresApproval: false };
    let resource;
    try {
      resource = await this.resolver.resolve(request.path);
    } catch {
      return { decision: "deny", reason: "UNRESOLVED_PATH", requiresApproval: false };
    }
    if (!resource.insideWorkspace) {
      const decision = this.config.policies.outsideWorkspace ?? "deny";
      return {
        decision,
        reason: "OUTSIDE_WORKSPACE",
        requiresApproval: decision === "ask",
        resolvedPath: resource.canonicalPath,
      };
    }
    if (resource.denied)
      return {
        decision: "deny",
        reason: "DENIED_PATH",
        requiresApproval: false,
        resolvedPath: resource.canonicalPath,
      };
    if (!resource.allowed)
      return {
        decision: this.config.defaultDecision,
        reason: "OPERATION_POLICY",
        requiresApproval: this.config.defaultDecision === "ask",
        resolvedPath: resource.canonicalPath,
      };
    const agentDecision = this.config.agentPolicies[request.agent]?.[request.operation];
    const decision =
      agentDecision ??
      this.config.policies[request.operation] ??
      fallbackPolicies[request.operation];
    return {
      decision,
      reason: agentDecision
        ? "AGENT_POLICY"
        : decision === "allow"
          ? "ALLOWED_PATH"
          : "OPERATION_POLICY",
      requiresApproval: decision === "ask",
      resolvedPath: resource.canonicalPath,
    };
  }
}

export async function testPolicy(
  config: GuardConfig,
  requests: EvaluationRequest[],
): Promise<PolicyResult[]> {
  const resolver = new PathResolver(config.workspace, config.allowedPaths, config.deniedPaths);
  const engine = new PolicyEngine(config, resolver);
  return Promise.all(requests.map((request) => engine.evaluate(request)));
}
