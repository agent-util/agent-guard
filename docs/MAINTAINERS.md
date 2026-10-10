# Maintainer guide

Require review for policy, resolver, approval, and release changes. Run `npm run prepublishOnly`, inspect `npm pack --dry-run`, update `CHANGELOG.md`, create a signed version tag, and publish from the protected GitHub environment using npm trusted publishing. Never release from an unreviewed branch or add an automatic publish-on-push workflow.
