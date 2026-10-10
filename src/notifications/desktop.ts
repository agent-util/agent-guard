import type { AuditRecord } from "../types/index.js";

export interface DesktopNotificationAdapter {
  readonly name: string;
  available(): Promise<boolean>;
  notify(notification: { title: string; body: string }): Promise<void>;
}

export function desktopNotifier(
  adapter: DesktopNotificationAdapter,
): (record: AuditRecord) => Promise<void> {
  return async (record) => {
    if (!(await adapter.available())) {
      throw new Error(`Desktop notification adapter ${adapter.name} is unavailable`);
    }
    await adapter.notify({
      title: `Agent Guard: ${record.decision}`,
      body: `${record.agent} ${record.operation}: ${record.reason}`,
    });
  };
}
