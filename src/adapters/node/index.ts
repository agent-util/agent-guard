import { open, rename as fsRename, rm } from "node:fs/promises";
import type { AgentGuard } from "../../core/guard.js";
import type { EvaluationRequest, FileOperation } from "../../types/index.js";

export class AccessDeniedError extends Error {
  readonly code = "AGENT_GUARD_DENIED";
  constructor(
    readonly request: EvaluationRequest,
    readonly reason: string,
  ) {
    super(`Agent Guard denied ${request.operation} on ${request.path}: ${reason}`);
    this.name = "AccessDeniedError";
  }
}

export class GuardedFs {
  constructor(
    private readonly guard: AgentGuard,
    private readonly agent: string,
  ) {}
  private async check(operation: FileOperation, target: string): Promise<string> {
    const request = { agent: this.agent, operation, path: target } as const;
    const authorization = await this.guard.authorize(request, "sdk");
    if (!authorization.allowed || !authorization.result.resolvedPath)
      throw new AccessDeniedError(request, authorization.result.reason);
    const resolved = await this.guard.resolver.resolve(target);
    if (resolved.canonicalPath !== authorization.result.resolvedPath)
      throw new AccessDeniedError(request, "RESOURCE_CHANGED");
    return resolved.canonicalPath;
  }
  async readFile(target: string, encoding: BufferEncoding = "utf8"): Promise<string> {
    const verified = await this.check("read", target);
    const handle = await open(verified, "r");
    try {
      return await handle.readFile({ encoding });
    } finally {
      await handle.close();
    }
  }
  async writeFile(target: string, data: string | Uint8Array): Promise<void> {
    const verified = await this.check("write", target);
    const handle = await open(verified, "r+");
    try {
      await handle.truncate(0);
      await handle.writeFile(data);
      await handle.sync();
    } finally {
      await handle.close();
    }
  }
  async createFile(target: string, data: string | Uint8Array = ""): Promise<void> {
    const verified = await this.check("create", target);
    const handle = await open(verified, "wx", 0o600);
    try {
      await handle.writeFile(data);
      await handle.sync();
    } finally {
      await handle.close();
    }
  }
  async delete(target: string): Promise<void> {
    const verified = await this.check("delete", target);
    await rm(verified, { recursive: false });
  }
  async rename(from: string, to: string): Promise<void> {
    const source = await this.check("rename", from);
    const destination = await this.check("rename", to);
    await fsRename(source, destination);
  }
}

export function createGuardedFs(guard: AgentGuard, agent: string): GuardedFs {
  if (!agent.trim()) throw new Error("Agent identity is required");
  return new GuardedFs(guard, agent);
}
