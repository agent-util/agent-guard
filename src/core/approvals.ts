import { randomBytes, timingSafeEqual } from "node:crypto";
import type { EvaluationRequest } from "../types/index.js";

interface ApprovalGrant {
  binding: string;
  expiresAt: number;
  used: boolean;
}
export interface ApprovalPrompt {
  request: EvaluationRequest;
  correlationId: string;
  timeoutMs: number;
}
export type ApprovalHandler = (
  prompt: ApprovalPrompt,
) => Promise<"allow-once" | "allow-session" | "deny">;

export class ApprovalManager {
  private readonly grants = new Map<string, ApprovalGrant>();
  constructor(
    private readonly timeoutMs: number,
    private readonly tokenTtlMs: number,
    private readonly handler?: ApprovalHandler,
  ) {}

  private binding(request: EvaluationRequest): string {
    return JSON.stringify([request.agent, request.operation, request.path]);
  }

  async request(request: EvaluationRequest, correlationId: string): Promise<string | undefined> {
    if (!this.handler) return undefined;
    let timer: NodeJS.Timeout | undefined;
    try {
      const timeout = new Promise<"deny">((resolve) => {
        timer = setTimeout(() => resolve("deny"), this.timeoutMs);
      });
      const answer = await Promise.race([
        this.handler({ request, correlationId, timeoutMs: this.timeoutMs }),
        timeout,
      ]);
      if (answer === "deny") return undefined;
      const token = randomBytes(32).toString("base64url");
      this.grants.set(token, {
        binding: this.binding(request),
        expiresAt:
          answer === "allow-session" ? Number.MAX_SAFE_INTEGER : Date.now() + this.tokenTtlMs,
        used: false,
      });
      return token;
    } catch {
      return undefined;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  consume(token: string, request: EvaluationRequest): boolean {
    const grant = this.grants.get(token);
    if (!grant || grant.used || grant.expiresAt < Date.now()) return false;
    const expected = Buffer.from(grant.binding);
    const actual = Buffer.from(this.binding(request));
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;
    grant.used = true;
    this.grants.delete(token);
    return true;
  }
}
