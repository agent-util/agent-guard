import type { AuditRecord } from "../types/index.js";
export function terminalNotifier(
  stream: NodeJS.WritableStream = process.stderr,
): (record: AuditRecord) => void {
  return (record) =>
    stream.write(
      `[agent-guard] ${record.decision.toUpperCase()} ${record.operation} ${record.path} (${record.reason})\n`,
    );
}
