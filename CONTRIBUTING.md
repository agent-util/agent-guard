# Contributing to Agent Guard

Thank you for helping make AI agent tooling safer. Contributions of code, tests, documentation, threat analysis, platform fixtures, and issue triage are welcome.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md). Security vulnerabilities must be reported privately according to [SECURITY.md](SECURITY.md), not through a public issue.

## Before you start

- Search existing issues and pull requests to avoid duplicate work.
- Open an issue before a large feature, policy change, new dependency, or adapter.
- Keep changes focused. Separate refactoring from behavior changes when practical.
- Never claim enforcement that the implementation cannot demonstrate.

Issues labeled `good first issue` are intended to be small and independently testable. Documentation improvements, platform fixtures, diagnostics, and adversarial path cases are useful starting points.

## Development setup

Requirements:

- Node.js 20 or newer
- npm 10 or newer
- macOS, Linux, or Windows

```bash
git clone https://github.com/agent-util/agent-guard.git
cd agent-guard
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

Use `npm run format` before submitting changes. Smaller test suites are also available:

```bash
npm run test:unit
npm run test:integration
```

## Security engineering expectations

Changes to path resolution, policy precedence, approvals, filesystem wrappers, audit storage, or adapters require adversarial tests. Consider at least:

- relative and absolute path traversal
- symlinked parents and missing path components
- alternate separators and Windows drive semantics
- resource replacement between authorization and execution
- approval timeout, replay, and cross-resource reuse
- adapter, logger, and notification failures
- sensitive information in errors and audit records

Fail closed when an authorization, identity, validation, or audit requirement cannot be satisfied. Do not add file-content logging. Document any time-of-check/time-of-use limitation that remains.

## Adding an adapter

An adapter must:

1. Use an official, documented extension point.
2. State exactly which operations it can intercept and cancel.
3. Mark every unsupported capability explicitly.
4. Include integration tests demonstrating enforcement.
5. Explain how it interacts with the host agent's sandbox and approvals.

Observation-only hooks must be described as audit-only. An adapter must never claim to restrict unrelated tools, shell commands, or processes.

## Pull requests

Before opening a pull request, run:

```bash
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
npm pack --dry-run
```

In the pull request:

- explain the problem and chosen design
- describe security impact and enforcement scope
- link the relevant issue
- include tests and documentation updates
- identify new dependencies or platform-specific behavior
- keep generated artifacts and secrets out of the commit

Maintainers may request changes when behavior is insufficiently tested, expands the trusted computing base, weakens fail-closed behavior, or overstates security guarantees.

## Commit and release practices

Write clear, imperative commit messages such as `fix: reject symlinked missing parents`. Sign commits when possible. Maintainers follow the reviewed process in [docs/RELEASING.md](docs/RELEASING.md); publishing credentials and release approvals are never requested in pull requests.

## Recognition

Every constructive contribution matters. Contributors may be acknowledged in release notes and project documentation. Thank you for helping keep agent tooling honest and secure.
