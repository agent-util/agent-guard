import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const esm = await import("../dist/index.js");
const require = createRequire(import.meta.url);
const cjs = require("../dist/index.cjs");

assert.equal(typeof esm.createAgentGuard, "function", "ESM export is missing");
assert.equal(typeof cjs.createAgentGuard, "function", "CommonJS export is missing");
assert.equal(typeof esm.CodexAdapter, "function", "Adapter exports are missing");

const cli = spawnSync(process.execPath, ["dist/cli/index.js", "--version"], {
  encoding: "utf8",
});
assert.equal(cli.status, 0, cli.stderr);
assert.match(cli.stdout, /^\d+\.\d+\.\d+\s*$/u, "CLI did not print a semantic version");

console.log("Package ESM, CommonJS, and CLI smoke tests passed.");
