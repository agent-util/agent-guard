# Releasing Agent Guard

Releases are deliberate and never run automatically on every commit. The repository includes a manually dispatched GitHub Actions workflow that uses npm provenance and is intended for npm trusted publishing.

## One-time repository setup

1. In npm, create or select the `@agent-utils` organization and confirm you have permission to publish `@agent-utils/agent-guard`.
2. On npmjs.com, open the package's **Publishing access** settings and add a trusted publisher for:
   - Organization or user: `agent-util`
   - Repository: `agent-guard`
   - Workflow filename: `publish.yml`
   - Environment: `npm`
3. In GitHub, create an environment named `npm` under **Settings → Environments**.
4. Add required reviewers to that environment so publishing needs explicit approval.
5. Protect the default branch and require the `CI / verify` checks before merging.
6. Enable GitHub Discussions and private vulnerability reporting if the project uses the support links in this repository.

Trusted publishing does not require a long-lived `NPM_TOKEN`. If trusted publishing is unavailable for the account, use an npm automation token stored as the `NPM_TOKEN` environment secret and update the workflow only after security review.

## Prepare a release

1. Pull the latest default branch and create a release-preparation branch.
2. Choose the next semantic version:

   ```bash
   npm version patch --no-git-tag-version
   # or: npm version minor --no-git-tag-version
   # or: npm version major --no-git-tag-version
   ```

3. Move relevant entries in `CHANGELOG.md` from **Unreleased** into a dated version section.
4. Verify that `package.json` repository, homepage, bugs, funding, exports, and `files` metadata are correct.
5. Run the complete local release gate:

   ```bash
   npm ci
   npm run format:check
   npm run typecheck
   npm run lint
   npm test
   npm run build
   npm audit --audit-level=high
   npm pack --dry-run
   ```

6. Inspect the `npm pack --dry-run` file list. It must contain the built ESM, CommonJS, declarations, CLI, README, license, and security policy, and must not contain credentials, local audit logs, or source fixtures with secrets.
7. Commit the version and changelog, push the branch, and open a pull request.
8. Merge only after review and green CI.

## Publish through GitHub Actions

1. Create and push a signed version tag matching `package.json`:

   ```bash
   git switch main
   git pull --ff-only
   git tag -s v0.1.0 -m "Release v0.1.0"
   git push origin v0.1.0
   ```

2. Create a GitHub Release from that tag and copy the relevant changelog entries into the release notes.
3. Open **Actions → Publish → Run workflow** and select the tagged/default-branch revision.
4. Approve the protected `npm` environment deployment.
5. Confirm that the workflow runs `prepublishOnly` and publishes with provenance.
6. Verify the public package:

   ```bash
   npm view @agent-utils/agent-guard version
   npm view @agent-utils/agent-guard dist-tags
   npm install @agent-utils/agent-guard
   npx @agent-utils/agent-guard --help
   ```

## Updating an existing release

npm releases are immutable. Never overwrite a published version. Make the fix, add tests, update the changelog, increment the version, and publish a new patch, minor, or major release. Use npm deprecation only when a published version is unsafe or materially broken:

```bash
npm deprecate @agent-utils/agent-guard@0.1.0 "Please upgrade to 0.1.1"
```

Do not use `npm unpublish` except within npm's permitted window and only for an urgent legal or security reason.
