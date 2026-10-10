import { lstat, realpath } from "node:fs/promises";
import path from "node:path";
import picomatch from "picomatch";

export interface ResolvedResource {
  input: string;
  absolutePath: string;
  canonicalPath: string;
  relativePath: string;
  exists: boolean;
  insideWorkspace: boolean;
  denied: boolean;
  allowed: boolean;
}

const normalizeGlobPath = (value: string): string => value.split(path.sep).join("/");
const isInside = (parent: string, candidate: string): boolean => {
  const relative = path.relative(parent, candidate);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))
  );
};

async function canonicalizeMissing(
  candidate: string,
): Promise<{ canonical: string; exists: boolean }> {
  let cursor = candidate;
  const tail: string[] = [];
  while (true) {
    try {
      const canonicalParent = await realpath(cursor);
      return {
        canonical: path.resolve(canonicalParent, ...tail.reverse()),
        exists: tail.length === 0,
      };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT" && code !== "ENOTDIR") throw error;
      const parent = path.dirname(cursor);
      if (parent === cursor) throw error;
      tail.push(path.basename(cursor));
      cursor = parent;
    }
  }
}

export class PathResolver {
  readonly workspace: string;
  private readonly workspaceCanonical: Promise<string>;
  private readonly deniedMatchers: Array<(value: string) => boolean>;
  private readonly allowedMatchers: Array<(value: string) => boolean>;

  constructor(workspace: string, allowedPaths: string[], deniedPaths: string[]) {
    this.workspace = path.resolve(workspace);
    this.workspaceCanonical = realpath(this.workspace);
    const options = { dot: true, nocase: process.platform === "win32", bash: true };
    this.deniedMatchers = deniedPaths.map((pattern) => {
      const expanded = pattern.startsWith("~/")
        ? path.join(process.env.HOME ?? "", pattern.slice(2))
        : pattern;
      const normalized = normalizeGlobPath(
        path.isAbsolute(expanded) ? path.resolve(expanded) : expanded,
      );
      return picomatch(normalized, options);
    });
    this.allowedMatchers = allowedPaths.map((pattern) => {
      const normalized = normalizeGlobPath(
        path.isAbsolute(pattern) ? path.resolve(pattern) : pattern,
      );
      return picomatch(
        normalized === "." ? "**" : `${normalized.replace(/\/$/, "")}{,/**}`,
        options,
      );
    });
  }

  async resolve(input: string): Promise<ResolvedResource> {
    if (!input || input.includes("\0")) throw new Error("Invalid filesystem path");
    const expanded = input.startsWith("~/")
      ? path.join(process.env.HOME ?? "", input.slice(2))
      : input;
    const absolutePath = path.resolve(this.workspace, expanded);
    const workspaceCanonical = await this.workspaceCanonical;
    const { canonical, exists } = await canonicalizeMissing(absolutePath);
    const relativePath = normalizeGlobPath(path.relative(workspaceCanonical, canonical));
    const normalizedAbsolute = normalizeGlobPath(canonical);
    const targets = [relativePath || ".", normalizedAbsolute];
    return {
      input,
      absolutePath,
      canonicalPath: canonical,
      relativePath,
      exists,
      insideWorkspace: isInside(workspaceCanonical, canonical),
      denied: this.deniedMatchers.some((matcher) => targets.some((target) => matcher(target))),
      allowed: this.allowedMatchers.some((matcher) => targets.some((target) => matcher(target))),
    };
  }

  async fingerprint(input: string): Promise<string> {
    const resource = await this.resolve(input);
    if (!resource.exists) return `missing:${resource.canonicalPath}`;
    const stat = await lstat(resource.canonicalPath);
    return `${resource.canonicalPath}:${stat.dev}:${stat.ino}:${stat.mtimeMs}:${stat.size}`;
  }
}

export function normalizeWindowsPathForTesting(input: string): string {
  return path.win32.normalize(
    input.replace(/^([a-z]):/i, (_, drive: string) => `${drive.toUpperCase()}:`),
  );
}
