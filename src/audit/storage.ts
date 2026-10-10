import { mkdir, open, readFile, rename, rm, stat } from "node:fs/promises";
import path from "node:path";

export class JsonlStorage {
  constructor(
    readonly file: string,
    private readonly maxBytes: number,
    private readonly retentionFiles: number,
  ) {}
  async append(value: unknown): Promise<void> {
    await mkdir(path.dirname(this.file), { recursive: true, mode: 0o700 });
    try {
      if ((await stat(this.file)).size >= this.maxBytes) await this.rotate();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const handle = await open(this.file, "a", 0o600);
    try {
      await handle.appendFile(`${JSON.stringify(value)}\n`, { encoding: "utf8" });
      await handle.sync();
    } finally {
      await handle.close();
    }
  }
  async readAll<T>(): Promise<T[]> {
    const files = Array.from({ length: this.retentionFiles }, (_, index) =>
      index === 0 ? this.file : `${this.file}.${index}`,
    ).reverse();
    const values: T[] = [];
    for (const file of files) {
      const content = await readFile(file, "utf8").catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return "";
        throw error;
      });
      for (const line of content.split("\n")) {
        if (line.trim()) values.push(JSON.parse(line) as T);
      }
    }
    return values;
  }
  private async rotate(): Promise<void> {
    await rm(`${this.file}.${this.retentionFiles}`, { force: true });
    for (let index = this.retentionFiles - 1; index >= 1; index--) {
      try {
        await rename(`${this.file}.${index}`, `${this.file}.${index + 1}`);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
    try {
      await rename(this.file, `${this.file}.1`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}
