# Contributing

Contributions of code, tests, documentation, threat analysis, platform fixtures, and issue triage are welcome.

## Before you start

- Search existing issues and pull requests.
- Open an issue before a large feature, policy change, dependency, or adapter.
- Keep changes focused and separate refactoring from behavior changes.
- Never claim enforcement the implementation cannot demonstrate.

## Development

```bash
git clone https://github.com/agent-util/agent-guard.git
cd agent-guard
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run docs:build
```

Security-sensitive changes need adversarial tests for traversal, symlinks, alternate path forms, resource replacement, approval replay, fail-closed behavior, and sensitive audit data as applicable.

Read the complete [contribution guidelines](https://github.com/agent-util/agent-guard/blob/main/CONTRIBUTING.md) before submitting a pull request.
