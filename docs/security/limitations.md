# Known limitations

## No universal interception

A normal Node.js library cannot intercept filesystem operations performed by unrelated processes. SDK and MCP enforcement covers only calls routed through their wrappers.

## Time-of-check/time-of-use

Reads and in-place writes use verified handles to reduce path-swap exposure. Creation, rename, and deletion still require pathname syscalls in Node.js and retain a race window. MCP handlers are revalidated before invocation, but third-party code may later reopen the path.

## Watchers are audit-only

Filesystem watchers report create, change, delete, and rename-like events with platform-dependent semantics. They do not reliably observe reads and do not establish which agent caused a change.

## Vendor integrations

The package does not ship guessed or undocumented integrations for Claude Code, Cursor, or OpenAI Codex. Pending or unsupported capabilities remain explicitly marked until an official cancellation hook can be verified and tested.

## Platform differences

Path syntax, case sensitivity, watcher behavior, file identity, network filesystems, and handle semantics differ across macOS, Linux, and Windows. Test policy fixtures on every platform in your deployment matrix.
