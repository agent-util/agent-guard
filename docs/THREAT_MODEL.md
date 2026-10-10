# Threat model

## Protected assets

Files outside the configured workspace, explicitly denied files inside it, audit integrity, and the binding between an approval and one operation.

## Considered threats

- `..`, absolute path, alternate separator, and symlink traversal
- a missing leaf beneath a symlinked parent
- deny-glob bypasses and agent identity confusion
- approval timeout, replay, cross-resource reuse, and resource change during approval
- log leakage of sensitive path names
- adapter or notification failure causing fail-open behavior

## Trust boundaries and exclusions

The host process, configuration file, and package code are trusted. An attacker who can change these can bypass the SDK. Unwrapped filesystem calls, unrelated processes, kernel compromise, hard-link aliases created by a privileged attacker, network filesystems with unstable identity, and races in path-based mutation syscalls are outside the enforcement guarantee. The watcher is observation only and cannot reliably observe reads or attribute events to an agent.
