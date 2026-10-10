import { watch, type FSWatcher } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import picomatch from "picomatch";

export interface WatchEvent {
  type: "create-or-modify" | "delete-or-rename";
  path: string;
  timestamp: string;
  enforcement: "audit-only";
}
export interface WatchOptions {
  paths: string[];
  ignored?: string[];
  debounceMs?: number;
  onEvent: (event: WatchEvent) => void;
}
export class AuditWatcher {
  private readonly watchers: FSWatcher[] = [];
  private readonly timers = new Map<string, NodeJS.Timeout>();
  constructor(private readonly options: WatchOptions) {}
  start(): void {
    const ignored = picomatch(this.options.ignored ?? [], { dot: true });
    for (const root of this.options.paths)
      this.watchers.push(
        watch(root, { recursive: true }, (event, filename) => {
          if (!filename) return;
          const target = path.resolve(root, filename.toString());
          if (ignored(target)) return;
          const key = `${event}:${target}`;
          const old = this.timers.get(key);
          if (old) clearTimeout(old);
          this.timers.set(
            key,
            setTimeout(() => void (async () => {
              this.timers.delete(key);
              // fs.watch does not portably distinguish create, delete, and rename.
              // Preserve that uncertainty rather than inventing attribution.
              const exists = await stat(target).then(() => true, () => false);
              this.options.onEvent({
                type: event === "rename" && !exists ? "delete-or-rename" : "create-or-modify",
                path: target,
                timestamp: new Date().toISOString(),
                enforcement: "audit-only",
              });
            })(), this.options.debounceMs ?? 100),
          );
        }),
      );
  }
  stop(): void {
    for (const watcher of this.watchers) watcher.close();
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.watchers.length = 0;
    this.timers.clear();
  }
}
