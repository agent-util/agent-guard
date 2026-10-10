# Threat-modeling filesystem access for AI coding agents

AI coding agents combine natural-language instructions with powerful tools: file readers, editors, shell commands, and MCP servers. The security question is not whether the model intends to behave safely. It is whether every consequential operation crosses a boundary that can make a deterministic decision before the operation executes.

This article describes the threat model behind Agent Guard and the claims the project deliberately does not make.

## The asset and the adversary

The protected assets are source integrity, credentials, files outside the assigned workspace, policy decisions, and the audit trail. Relevant failures include accidental model behavior, prompt injection in repository content, an incorrect tool argument, an overly broad integration, or compromised third-party instructions.

Agent Guard does not assume that a model-generated path is trustworthy. Inputs such as `../../private/key`, absolute paths, symlinked parents, missing destination leaves, and alternate separators must all be resolved before policy evaluation.

The host application, Agent Guard configuration, and the process loading the package are trusted. If an attacker can replace the package, edit the active policy, disable hooks, or invoke arbitrary unwrapped system calls, project-level SDK enforcement can be bypassed.

## Four different enforcement levels

### 1. SDK enforcement

`GuardedFs` evaluates an operation and target before calling Node.js filesystem APIs. Reads and in-place writes reopen verified canonical paths through handles. Denied operations throw without executing the requested mutation.

This is strong for code that consistently uses the wrapper. It says nothing about another dependency calling `node:fs` directly.

### 2. Tool-wrapper enforcement

An MCP server can wrap each filesystem-capable handler. Agent Guard evaluates all declared path arguments before the handler runs. A rename tool, for example, must validate both its source and destination.

The boundary covers only registered wrapped tools. Another MCP server, a shell tool, or an unwrapped handler remains outside it.

### 3. Agent-hook enforcement

Claude Code, Cursor, and Codex expose documented pre-tool hooks for portions of their direct tool surfaces. Agent Guard project adapters translate policy results into each host's blocking response format.

Hook coverage is not equivalent to process confinement. A direct edit can be checked while a shell command may still invoke another program that reads or writes arbitrary paths. Some cloud, hosted, specialized, or untrusted-project execution paths may not run local hooks.

### 4. OS sandbox enforcement

Only an operating-system boundary can constrain every system call made by a process and its children. Containers, VMs, restricted accounts, and native agent sandboxes remain necessary when the agent process itself is untrusted.

Agent Guard complements this layer by adding application-specific policy, approvals, structured reasons, and auditing.

## Policy precedence

The engine evaluates policy in a fixed order:

1. Determine whether the canonical target is inside the workspace.
2. Apply explicit deny patterns.
3. Require the target to match an allowed boundary.
4. Apply an agent-specific operation rule.
5. Apply the general operation rule.
6. Use the configured default decision.

This prevents a broad allow rule from overriding a sensitive-path denial. Unresolved paths are treated conservatively.

## Approval is authorization, not a bypass

An approval grant binds to the agent identity, operation, and resource. One-time grants are consumed once; session grants remain scoped to the exact binding and are cleared when the guard stops. The resource is fingerprinted around the approval pause so a changed target does not inherit an earlier decision.

No approval handler, a handler error, or a timeout results in denial. Vendor hooks can delegate an `ask` decision to the host's native prompt, but Agent Guard cannot observe the user's final host-native choice.

## Audit and privacy

Audit records contain metadata needed to reconstruct a policy decision: timestamp, agent, operation, decision, reason, enforcement source, session, correlation ID, and policy version.

File contents are never included. Sensitive-looking paths are redacted before JSONL storage. Webhooks omit paths unless an operator explicitly enables them. Filesystem watchers are audit-only and cannot reliably identify reads or attribute a change to a particular agent.

## Residual risks

Node.js does not expose a portable handle-relative API for every mutation. Create, rename, and delete operations therefore retain time-of-check/time-of-use windows. Network filesystems, hard links, platform-specific aliases, and privileged attackers can introduce additional behavior outside the tested model.

Project hooks are also project files. For organizational tamper resistance, deploy managed host policies and protect configuration changes through code review.

## Practical deployment checklist

- Keep the agent's native sandbox and approval controls enabled.
- Put credentials outside agent workspaces whenever possible.
- Wrap every filesystem-capable MCP tool and validate every path argument.
- Default outside-workspace access and deletion to deny.
- Treat shell execution as a separate high-risk capability.
- Run autonomous workloads under a restricted account or container.
- Protect policy and hook files with mandatory review.
- Monitor denials and approval requests without collecting source contents.
- Re-run adversarial and cross-platform tests when changing path logic.

The central principle is simple: a security claim should be no broader than the code path that enforces it. Agent Guard is useful precisely because it exposes those boundaries instead of presenting monitoring as universal prevention.
