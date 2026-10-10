# Known limitations

## No universal interception

A normal Node.js library cannot intercept filesystem operations performed by unrelated processes. SDK and MCP enforcement covers only calls routed through their wrappers.

## Time-of-check/time-of-use

Reads and in-place writes use verified handles to reduce path-swap exposure. Creation, rename, and deletion still require pathname syscalls in Node.js and retain a race window. MCP handlers are revalidated before invocation, but third-party code may later reopen the path.

## Watchers are audit-only

Filesystem watchers report create, change, delete, and rename-like events with platform-dependent semantics. They do not reliably observe reads and do not establish which agent caused a change.

## Vendor integrations

Project adapters use documented blocking hooks: Claude Code `PreToolUse`, Cursor `preToolUse`, and Codex `PreToolUse`. They cover only the direct file tools listed in the capability matrix. They do not intercept arbitrary shell filesystem access, hosted tools, early read-only Cursor Cloud exploration, disabled hooks, untrusted-project configurations, or specialized host paths that bypass local hooks.

Hook configuration can be changed by anyone who can modify the project. Use enterprise-managed policy where tamper resistance is required. Keep each host's sandbox and native approval system enabled; Agent Guard does not replace them.

## Platform differences

Path syntax, case sensitivity, watcher behavior, file identity, network filesystems, and handle semantics differ across macOS, Linux, and Windows. Test policy fixtures on every platform in your deployment matrix.
