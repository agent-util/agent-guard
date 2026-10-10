# Maintainer guide

Require review for changes to path resolution, policy precedence, approvals, audit handling, enforcing adapters, and releases.

## Pull-request expectations

- All CI checks pass on supported Node.js versions.
- Security-sensitive behavior includes adversarial tests.
- Documentation states the exact enforcement scope.
- New runtime dependencies have a clear justification.
- Agent integrations cite an official extension point and tested cancellation behavior.

## Release responsibilities

- Review the package contents with `npm pack --dry-run`.
- Verify the changelog and semantic version.
- Publish through the protected GitHub `npm` environment.
- Prefer npm Trusted Publishing and provenance over long-lived tokens.
- Verify the installed package and CLI after publication.

See the [release guide](./releasing) for the complete procedure.
