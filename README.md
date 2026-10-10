# @agent-utils/agent-guard

<p align="center">
  <strong>Agent Guard — Keep AI Agents Inside Their Boundaries.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@agent-utils/agent-guard"><img src="https://img.shields.io/npm/v/@agent-utils/agent-guard?style=for-the-badge&logo=npm&label=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@agent-utils/agent-guard"><img src="https://img.shields.io/npm/dm/@agent-utils/agent-guard?style=for-the-badge&logo=npm&label=downloads" alt="npm downloads"></a>
  <a href="https://github.com/agent-util/agent-guard/issues"><img src="https://img.shields.io/github/issues/agent-util/agent-guard?style=for-the-badge&logo=github&label=issues" alt="GitHub issues"></a>
  <a href="https://github.com/sponsors/Dheerajprogrammer"><img src="https://img.shields.io/badge/Sponsor-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="Sponsor Dheerajprogrammer"></a>
</p>

<p align="center">
  <a href="https://github.com/agent-util/agent-guard/actions/workflows/ci.yml"><img src="https://github.com/agent-util/agent-guard/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <a href="https://www.npmjs.com/package/@agent-utils/agent-guard"><img src="https://img.shields.io/npm/types/@agent-utils/agent-guard" alt="TypeScript declarations"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license"></a>
  <img src="https://img.shields.io/node/v/@agent-utils/agent-guard" alt="Node.js version">
</p>

An open-source TypeScript security toolkit for enforcing workspace policies, auditing filesystem operations, and adding human approval workflows to supported AI coding agents.

## Why Agent Guard?

AI coding agents can read, create, modify, execute, or delete files while completing a task. Agent Guard gives integration authors a single, testable policy layer for those operations:

- **Workspace boundaries** with canonical path and symlink checks
- **Deny-first policy rules** for sensitive files and directories
- **Human approval** with timeouts, scoped tokens, and replay prevention
- **Enforcing wrappers** for custom Node.js agents and MCP tools
- **Structured audit logs** with redaction, rotation, and correlation IDs
- **Security events** for terminal, webhook, and desktop adapters
- **Cross-platform API** for Node.js 20+ on macOS, Linux, and Windows

## Security boundary

> [!IMPORTANT]
> Agent Guard blocks operations only when they are routed through its SDK filesystem wrapper or MCP tool wrapper. It cannot intercept arbitrary filesystem calls from unrelated processes, replace Cursor or Codex sandboxes, or turn `agent-guard run` into an OS sandbox. Filesystem monitoring is audit-only. Use OS sandboxing in addition to Agent Guard when hostile-process isolation is required.

## Install

```bash
# npm
npm install @agent-utils/agent-guard

# pnpm
pnpm add @agent-utils/agent-guard

# yarn
yarn add @agent-utils/agent-guard
```

Node.js 20 or newer is required. Both ESM imports and CommonJS `require()` are exported.

## Quick start

```ts
import { createAgentGuard, createGuardedFs } from "@agent-utils/agent-guard";

const guard = createAgentGuard({
  workspace: process.cwd(),
  allowedPaths: ["./src", "./tests", "./docs"],
  deniedPaths: ["./.env", "./.env.*", "./secrets/**", "~/.ssh/**"],
  policies: {
    read: "allow",
    write: "ask",
    delete: "deny",
    outsideWorkspace: "deny",
  },
  approval: { timeoutMs: 30_000, defaultDecision: "deny" },
  audit: { enabled: true, redactSensitiveData: true },
  approvalHandler: async ({ request }) => {
    // Connect your trusted UI here. Absence, error, or timeout denies.
    return request.operation === "write" ? "allow-once" : "deny";
  },
});

await guard.start();
guard.on("access-denied", (event) => console.warn("Blocked", event));

const fs = createGuardedFs(guard, "my-agent");
const source = await fs.readFile("src/index.ts");
```

`evaluate()` is side-effect free and does not enforce access:

```ts
const result = await guard.evaluate({
  agent: "claude-code",
  operation: "write",
  path: "../private/config.json",
});
```

Use `authorize()`, `GuardedFs`, or an MCP wrapper when an operation must be stopped.

## MCP tool protection

Wrap each exposed filesystem tool before registering it with your MCP server:

```ts
import { writeFile } from "node:fs/promises";
import { createAgentGuard, wrapMcpTool } from "@agent-utils/agent-guard";

const guard = createAgentGuard({
  workspace: process.cwd(),
  allowedPaths: ["src", "tests"],
  policies: { read: "allow", write: "ask", delete: "deny" },
});

const guardedWrite = wrapMcpTool(
  guard,
  "my-mcp-agent",
  { operation: "write", pathArgument: "path" },
  async (call) => writeFile(String(call.arguments?.path), String(call.arguments?.content)),
);
```

This protects calls routed through `guardedWrite`; it does not restrict unrelated shell commands or unwrapped tools.

## CLI

```bash
npx @agent-utils/agent-guard init
agent-guard check ./src/index.ts --operation read
agent-guard check ../secrets/.env --operation read
agent-guard audit
agent-guard doctor
agent-guard adapters list
agent-guard policy validate
agent-guard run -- npm test
```

Exit codes for `check` are `0` for allow, `1` for deny, and `2` for ask. `run` clearly reports that the child process is **not sandboxed**.

## Configuration

| Key               | Meaning                             | Secure default                                           |
| ----------------- | ----------------------------------- | -------------------------------------------------------- |
| `workspace`       | Trusted boundary root               | Required                                                 |
| `allowedPaths`    | Relative allowed subtrees or globs  | `.`                                                      |
| `deniedPaths`     | Higher-priority deny globs          | `.env`, `.env.*`, `secrets/**`                           |
| `policies`        | Per-operation and outside decisions | Read allow; write ask; delete, execute, and outside deny |
| `agentPolicies`   | Per-agent operation overrides       | None                                                     |
| `defaultDecision` | Unmatched in-workspace path         | Deny                                                     |
| `approval`        | Timeout and token lifetime          | Deny on 30-second timeout                                |
| `audit`           | JSONL path, redaction, and rotation | Enabled and redacted                                     |

Operations are `read`, `write`, `create`, `delete`, `rename`, and `execute`. Decisions are `allow`, `deny`, and `ask`. Precedence is outside boundary → deny glob → allowed boundary → agent rule → operation rule → default.

## Events and notifications

```ts
guard.on("violation", (event) => console.error("Policy violation", event));
guard.on("approval-required", (request) => console.log("Approval required", request));
guard.on("access-denied", (event) => console.warn("Operation blocked", event));
```

Webhook delivery is disabled until explicitly configured and omits filesystem paths unless `includePath` is enabled. Desktop notifications require an explicitly supplied adapter. Notification failures never convert a denial into an allow.

## Compatibility matrix

| Integration  |        Read |       Write |      Delete |     Execute |    Approval |       Audit | Enforcement scope                            |
| ------------ | ----------: | ----------: | ----------: | ----------: | ----------: | ----------: | -------------------------------------------- |
| Node SDK     |         Yes |         Yes |         Yes |          No |         Yes |         Yes | Calls through `GuardedFs`                    |
| MCP wrapper  |         Yes |         Yes |         Yes |         Yes |         Yes |         Yes | Registered wrapped tools only                |
| Claude Code  |     Pending |     Pending |     Pending |     Pending |     Pending |     Pending | No unverified integration shipped            |
| Cursor       | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported | Does not override Cursor sandbox             |
| OpenAI Codex | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported | Unsupported | Use Codex sandbox and approvals              |
| Watcher      |          No |          No |          No |          No |          No |         Yes | Audit-only changes; reads are not observable |

## Security architecture and limitations

Paths are resolved against a canonical workspace and the nearest existing ancestor, preventing ordinary traversal and symlink-parent escapes. Deny patterns override allow patterns. Reads and in-place writes use verified handles.

Path-based create, rename, and delete operations retain time-of-check/time-of-use risk, as do hostile network filesystems and privileged hard-link manipulation. See the [architecture](docs/ARCHITECTURE.md), [threat model](docs/THREAT_MODEL.md), and [security policy](SECURITY.md).

No file contents are logged. Webhook notifications omit paths unless explicitly configured otherwise.

## Roadmap

- Verify and implement official vendor hook integrations where cancellation semantics are documented
- Add opt-in platform sandbox launchers
- Add native handle-relative mutation adapters where platforms expose safe APIs
- Expand structured audit filtering and platform notification adapters

## Contributing

Contributions are welcome—from documentation fixes and adversarial fixtures to carefully verified integration adapters. Please read the [contribution guide](CONTRIBUTING.md), open an issue before substantial architectural work, and include tests for security-sensitive changes.

- [Browse open issues](https://github.com/agent-util/agent-guard/issues)
- [Report a security vulnerability](SECURITY.md)
- [Read the maintainer guide](docs/MAINTAINERS.md)
- [Get project support](SUPPORT.md)

## Sponsor this project

Agent Guard is free and open source. Sponsorship helps fund security research, cross-platform testing, documentation, and long-term maintenance.

<p align="center">
  <a href="https://github.com/sponsors/Dheerajprogrammer"><img src="https://img.shields.io/badge/Sponsor%20Agent%20Guard-EA4AAA?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="Sponsor Agent Guard on GitHub"></a>
</p>

If Agent Guard protects a project or saves your team time, consider [becoming a sponsor](https://github.com/sponsors/Dheerajprogrammer). Stars, issue reports, documentation improvements, and sharing the project are also valuable ways to support it.

## License

Released under the [MIT License](LICENSE). Copyright © 2026 Agent Utils contributors.
