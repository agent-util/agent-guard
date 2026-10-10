import type { AuditRecord } from "../types/index.js";
export interface WebhookOptions {
  url: string;
  enabled: boolean;
  includePath?: boolean;
  headers?: Record<string, string>;
}
export function webhookNotifier(options: WebhookOptions): (record: AuditRecord) => Promise<void> {
  return async (record) => {
    if (!options.enabled) return;
    const body = options.includePath ? record : { ...record, path: "[OMITTED]" };
    const response = await fetch(options.url, {
      method: "POST",
      headers: { "content-type": "application/json", ...options.headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`Webhook returned HTTP ${response.status}`);
  };
}
