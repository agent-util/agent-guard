import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { Command } from "commander";
import packageJson from "../../package.json" with { type: "json" };
import { createAgentGuard } from "../core/guard.js";
import { operationSchema, validateConfig, type GuardConfigInput } from "../config/schema.js";
import { claudeCodeAdapter } from "../adapters/claude-code/index.js";
import { codexAdapter } from "../adapters/codex/index.js";
import { cursorAdapter } from "../adapters/cursor/index.js";
import { evaluateToolHook, type ToolHookInput } from "../adapters/hooks.js";

const CONFIG_FILE = "agent-guard.config.json";
const adapterMap = { "claude-code": claudeCodeAdapter, cursor: cursorAdapter, codex: codexAdapter };
async function readStdin(): Promise<string> {
  let input = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) input += String(chunk);
  return input;
}
async function loadConfig(cwd = process.cwd()): Promise<GuardConfigInput> {
  return JSON.parse(await readFile(path.join(cwd, CONFIG_FILE), "utf8")) as GuardConfigInput;
}
const secureDefault = {
  workspace: ".",
  allowedPaths: ["src", "tests", "docs"],
  deniedPaths: [".env", ".env.*", "secrets/**", "~/.ssh/**"],
  policies: {
    read: "allow",
    write: "ask",
    create: "ask",
    delete: "deny",
    rename: "ask",
    execute: "deny",
    outsideWorkspace: "deny",
  },
  audit: { enabled: true, redactSensitiveData: true },
} as const;

export function createProgram(): Command {
  const program = new Command()
    .name("agent-guard")
    .description("Policy enforcement for supported AI agent filesystem integrations")
    .version(packageJson.version);
  program
    .command("init")
    .description("Create a secure default configuration")
    .option("--force", "overwrite an existing configuration")
    .action(async (options: { force?: boolean }) => {
      const target = path.resolve(CONFIG_FILE);
      try {
        if (!options.force) {
          await readFile(target);
          throw new Error(`${CONFIG_FILE} already exists (use --force to replace it)`);
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      await writeFile(target, `${JSON.stringify(secureDefault, null, 2)}\n`, {
        encoding: "utf8",
        mode: 0o600,
      });
      console.log(`Created ${target}`);
    });
  program
    .command("check")
    .argument("<path>")
    .requiredOption("--operation <operation>")
    .option("--agent <agent>", "agent identity", "cli")
    .action(async (target: string, options: { operation: string; agent: string }) => {
      const operation = operationSchema.parse(options.operation);
      const guard = createAgentGuard(await loadConfig());
      const result = await guard.evaluate({ agent: options.agent, operation, path: target });
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = result.decision === "allow" ? 0 : result.decision === "ask" ? 2 : 1;
    });
  program
    .command("doctor")
    .description("Report effective protection capabilities")
    .action(async () => {
      let config = "valid";
      try {
        validateConfig(await loadConfig());
      } catch (error) {
        config = `invalid: ${error instanceof Error ? error.message : String(error)}`;
        process.exitCode = 1;
      }
      console.log(
        JSON.stringify(
          {
            node: process.version,
            platform: `${os.platform()} ${os.release()}`,
            config,
            enforcement: {
              sdk: true,
              mcpWrapper: true,
              osSandbox: false,
              unrelatedProcesses: false,
            },
            missingProtections: [
              "Unwrapped shell and filesystem tools are not intercepted",
              "No OS sandbox is installed by this package",
            ],
            activeAdapters: ["node-sdk", "mcp-wrapper"],
          },
          null,
          2,
        ),
      );
    });
  program
    .command("audit")
    .option("--tail <lines>", "number of records", "20")
    .option("--agent <agent>")
    .option("--operation <operation>")
    .option("--decision <decision>")
    .option("--since <date>")
    .option("--until <date>")
    .option("--json", "emit a JSON array instead of JSONL")
    .action(
      async (options: {
        tail: string;
        agent?: string;
        operation?: string;
        decision?: string;
        since?: string;
        until?: string;
        json?: boolean;
      }) => {
        const guard = createAgentGuard(await loadConfig());
        const records = await guard.queryAudit({
          limit: Number(options.tail),
          ...(options.agent ? { agent: options.agent } : {}),
          ...(options.operation ? { operation: operationSchema.parse(options.operation) } : {}),
          ...(options.decision ? { decision: options.decision as "allow" | "deny" | "ask" } : {}),
          ...(options.since ? { since: options.since } : {}),
          ...(options.until ? { until: options.until } : {}),
        });
        console.log(
          options.json
            ? JSON.stringify(records, null, 2)
            : records.map((record) => JSON.stringify(record)).join("\n"),
        );
      },
    );
  program
    .command("run")
    .description("Run a command; SDK audit only unless the command uses Agent Guard wrappers")
    .allowUnknownOption()
    .argument("<command>")
    .argument("[args...]")
    .action((command: string, args: string[]) => {
      console.error(
        "Agent Guard run does NOT sandbox this process. Only explicitly integrated SDK/MCP operations are enforced.",
      );
      const child = spawn(command, args, { stdio: "inherit", shell: false });
      child.on("exit", (code, signal) => {
        process.exitCode = code ?? (signal ? 1 : 0);
      });
    });
  const adapters = program.command("adapters");
  adapters.command("list").action(() => {
    console.log(
      JSON.stringify(
        [
          {
            name: "node-sdk",
            read: true,
            write: true,
            delete: true,
            execute: false,
            approval: true,
            auditing: true,
          },
          {
            name: "mcp-wrapper",
            read: true,
            write: true,
            delete: true,
            execute: true,
            approval: true,
            auditing: true,
          },
          claudeCodeAdapter,
          cursorAdapter,
          codexAdapter,
        ].map((item) =>
          "capabilities" in item ? { name: item.name, ...item.capabilities() } : item,
        ),
        null,
        2,
      ),
    );
  });
  adapters
    .command("install")
    .argument("<name>")
    .action(async (name: string) => {
      const adapter = adapterMap[name as keyof typeof adapterMap];
      if (!adapter) throw new Error(`Unknown adapter: ${name}`);
      await adapter.install();
      console.log(`Installed ${name} project hooks.`);
    });
  adapters
    .command("uninstall")
    .argument("<name>")
    .action(async (name: string) => {
      const adapter = adapterMap[name as keyof typeof adapterMap];
      if (!adapter) throw new Error(`Unknown adapter: ${name}`);
      await adapter.uninstall();
      console.log(`Removed Agent Guard from ${name} project hooks.`);
    });
  program
    .command("hook")
    .argument("<name>")
    .action(async (name: string) => {
      const adapter = adapterMap[name as keyof typeof adapterMap];
      if (!adapter) throw new Error(`Unknown adapter: ${name}`);
      try {
        const input = JSON.parse(await readStdin()) as ToolHookInput;
        const guard = createAgentGuard(await loadConfig());
        const result = await evaluateToolHook(guard, name, input);
        console.log(JSON.stringify(adapter.format(result)));
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 2;
      }
    });
  const policy = program.command("policy");
  policy.command("validate").action(async () => {
    validateConfig(await loadConfig());
    console.log("Policy configuration is valid.");
  });
  program.showHelpAfterError();
  return program;
}

createProgram()
  .parseAsync()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
