import { EventEmitter } from "node:events";
import type { AuditRecord, EvaluationRequest, PolicyResult } from "../types/index.js";

export interface GuardEvents {
  violation: [AuditRecord];
  "access-denied": [AuditRecord];
  "approval-required": [EvaluationRequest & PolicyResult & { correlationId: string }];
  audit: [AuditRecord];
}

export class GuardEventEmitter extends EventEmitter<GuardEvents> {}
