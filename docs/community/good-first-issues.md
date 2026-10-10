# Good first issue backlog

These tickets are deliberately narrow, testable, and safe for first-time contributors. Maintainers can open them with the `good first issue` and `help wanted` labels.

## Add webhook retry tests

**Suggested title:** `test: cover webhook retry and path omission behavior`

Add unit tests that mock `fetch` and verify:

- disabled webhooks make no request;
- paths are replaced with `[OMITTED]` by default;
- `includePath: true` includes the path;
- transient failures retry exactly the configured number of times;
- the last delivery error is returned after retries are exhausted.

Acceptance: tests pass on Node.js 20, 22, and 24 without making network requests. No production behavior change is required.

## Add watcher lifecycle tests

**Suggested title:** `test: cover audit watcher debounce and stop lifecycle`

Create temporary-directory tests for repeated change events, ignored paths, and cleanup after `stop()`. Keep assertions platform-tolerant because `fs.watch` does not consistently distinguish rename, create, and delete.

Acceptance: tests do not infer file reads or agent attribution and are stable on macOS, Linux, and Windows CI.

## Add a redacted audit export example

**Suggested title:** `docs: add a redacted audit export recipe`

Add a copy-paste example showing `guard.queryAudit()` and the CLI filters for agent, decision, and time range. Use fictional paths and demonstrate that sensitive-looking paths stay redacted.

Acceptance: the example typechecks, contains no real filesystem paths or secrets, and links to the audit security limitations.

## Triage checklist

Before opening a ticket:

- confirm no existing issue covers it;
- apply `good first issue` and `help wanted`;
- link the relevant source or documentation file;
- keep the scope to one pull request;
- state whether behavior changes require a security review.
