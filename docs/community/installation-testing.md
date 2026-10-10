# Three-person installation test

Maintainers should not assume that a successful local build means first-time setup is clear. Run this study with three developers who have not previously installed Agent Guard.

## Recruit three perspectives

1. An MCP or backend developer who has not used Agent Guard.
2. A Claude Code, Cursor, or Codex user who is comfortable with agent tools but not security SDKs.
3. A TypeScript developer unfamiliar with the repository.

Do not coach them during the first attempt. Give each person only the package name, repository URL, and this objective:

> Install Agent Guard in a disposable project, protect one direct file operation, verify an allowed path, and verify that an outside-workspace path is denied.

## Success criteria

- Installation and initial configuration finish within 15 minutes.
- The tester can explain which operations are actually enforced.
- `policy validate` succeeds.
- An allowed check exits `0` and an outside-workspace check exits `1`.
- The tester knows native agent sandboxing must remain enabled.

## Observer worksheet

| Tester | Environment | Time | Outcome | First confusion | Help requested |
| ------ | ----------- | ---: | ------- | --------------- | -------------- |
| A      |             |      |         |                 |                |
| B      |             |      |         |                 |                |
| C      |             |      |         |                 |                |

Record behavior, not assumptions. Do not enter invented results.

## Questions after the attempt

1. What did you expect Agent Guard to protect?
2. Which command or configuration field was least clear?
3. Did the difference between SDK, hook, sandbox, and audit-only coverage make sense?
4. Could you tell whether the denied handler actually remained unexecuted?
5. What single documentation change would have saved the most time?

Ask each tester to submit the [installation feedback form](https://github.com/agent-util/agent-guard/issues/new?template=installation_feedback.yml). Convert repeated confusion into documentation fixes or focused issues; never fabricate positive results for marketing.
