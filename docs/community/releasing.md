# Releasing

Agent Guard uses npm Trusted Publishing through a manually dispatched GitHub Actions workflow.

## Prepare

```bash
git switch main
git pull --ff-only
git switch -c release/vX.Y.Z
npm version patch --no-git-tag-version
```

Update `CHANGELOG.md`, then run:

```bash
npm ci
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
npm run docs:build
npm audit --audit-level=high
npm pack --dry-run
```

Commit the version and changelog, open a pull request, and merge only after review and green CI.

## Publish

Create a signed tag and GitHub Release, then run **Actions → Publish → Run workflow** from the default branch. Approve the protected `npm` environment when prompted.

Every npm version is immutable. If a workflow reports that a version already exists, increment the version rather than attempting to overwrite or unpublish it.

Read the complete [release procedure](https://github.com/agent-util/agent-guard/blob/main/docs/RELEASING.md) for trusted-publisher setup and verification commands.
