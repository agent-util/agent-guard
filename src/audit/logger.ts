import path from "node:path";
import type { AuditRecord } from "../types/index.js";
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
}
