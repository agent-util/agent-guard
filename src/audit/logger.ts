import path from "node:path";
import type { AuditFilter, AuditRecord } from "../types/index.js";
import { JsonlStorage } from "./storage.js";

const sensitive =
  /(^|[\\/.])(\.env(?:\..*)?|secrets?|credentials?|id_(?:rsa|ed25519)|api[-_]?key)([\\/.]|$)/i;
export function redactAuditRecord(record: AuditRecord): AuditRecord {
  if (!sensitive.test(record.path)) return record;
  return {
    ...record,
    path: `[REDACTED]/${path.basename(record.path).replace(/.*/, "sensitive-path")}`,
  };
}
export class AuditLogger {
  private readonly storage: JsonlStorage;
  constructor(
    file: string,
    maxBytes: number,
    retentionFiles: number,
    private readonly redact: boolean,
  ) {
    this.storage = new JsonlStorage(file, maxBytes, retentionFiles);
  }
  write(record: AuditRecord): Promise<void> {
    return this.storage.append(this.redact ? redactAuditRecord(record) : record);
  }
  async query(filter: AuditFilter = {}): Promise<AuditRecord[]> {
    const since = filter.since ? new Date(filter.since).getTime() : -Infinity;
    const until = filter.until ? new Date(filter.until).getTime() : Infinity;
    const records = (await this.storage.readAll<AuditRecord>()).filter((record) => {
      const timestamp = new Date(record.timestamp).getTime();
      return (
        timestamp >= since &&
        timestamp <= until &&
        (!filter.agent || record.agent === filter.agent) &&
        (!filter.operation || record.operation === filter.operation) &&
        (!filter.decision || record.decision === filter.decision) &&
        (!filter.enforcement || record.enforcement === filter.enforcement) &&
        (!filter.reason || record.reason === filter.reason) &&
        (!filter.sessionId || record.sessionId === filter.sessionId) &&
        (!filter.correlationId || record.correlationId === filter.correlationId)
      );
    });
    return filter.limit === undefined ? records : records.slice(-Math.max(0, filter.limit));
  }
}
