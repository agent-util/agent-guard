import type { AgentAdapter, AgentCapabilities } from "../types/index.js";

const unsupported: AgentCapabilities = {
  read: false,
  write: false,
  delete: false,
  execute: false,
  approval: false,
  auditing: false,
};
export class PendingDocumentedAdapter implements AgentAdapter {
  constructor(
    readonly name: string,
    private readonly reason: string,
  ) {}
  async detect(): Promise<boolean> {
    return false;
  }
  capabilities(): AgentCapabilities {
    return { ...unsupported };
  }
  async install(): Promise<void> {
    throw new Error(`${this.name} adapter is pending: ${this.reason}`);
  }
  async uninstall(): Promise<void> {}
}
export const claudeCodeAdapter = new PendingDocumentedAdapter(
  "claude-code",
  "official hook behavior has not been verified for this release",
);
export const cursorAdapter = new PendingDocumentedAdapter(
  "cursor",
  "no verified supported filesystem interception API is bundled",
);
export const codexAdapter = new PendingDocumentedAdapter(
  "codex",
  "use Codex's own sandbox and approval controls; this package does not replace them",
);
