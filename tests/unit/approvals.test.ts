import { describe, expect, it, vi } from "vitest";
import { ApprovalManager } from "../../src/index.js";
const request = { agent: "agent", operation: "write" as const, path: "src/a.ts" };
describe("approvals", () => {
  it("binds a single-use token to the exact request", async () => {
    const manager = new ApprovalManager(100, 1_000, async () => "allow-once");
    const token = await manager.request(request, "id");
    expect(token).toBeTruthy();
    expect(manager.consume(token!, { ...request, path: "src/b.ts" })).toBe(false);
    expect(manager.consume(token!, request)).toBe(true);
    expect(manager.consume(token!, request)).toBe(false);
  });
  it("denies when UI is unavailable", async () => {
    expect(await new ApprovalManager(10, 10).request(request, "id")).toBeUndefined();
  });
  it("reuses a session grant only for its exact binding", async () => {
    const handler = vi.fn(async () => "allow-session" as const);
    const manager = new ApprovalManager(100, 1_000, handler);
    const token = await manager.request(request, "id");
    expect(manager.consume(token!, request)).toBe(true);
    expect(manager.consume(token!, request)).toBe(true);
    expect(await manager.request(request, "another-id")).toBe(token);
    expect(handler).toHaveBeenCalledOnce();
    expect(manager.consume(token!, { ...request, operation: "delete" })).toBe(false);
  });
  it("defaults deny on timeout", async () => {
    vi.useFakeTimers();
    const manager = new ApprovalManager(10, 10, () => new Promise(() => {}));
    const pending = manager.request(request, "id");
    await vi.advanceTimersByTimeAsync(11);
    expect(await pending).toBeUndefined();
    vi.useRealTimers();
  });
});
