# Command-line interface

Create a secure starter configuration:

```bash
npx @agent-utils/agent-guard init
```

## Check a policy decision

```bash
agent-guard check ./src/index.ts --operation read
agent-guard check ../secrets/.env --operation read
```

Exit codes are `0` for allow, `1` for deny, and `2` for ask.

## Diagnostics

```bash
agent-guard doctor
agent-guard adapters list
agent-guard policy validate
agent-guard audit --tail 50
```

## Run a command

```bash
agent-guard run -- npm test
```

`run` does not sandbox the child process. Only operations performed through integrated Agent Guard SDK or MCP APIs are enforced.
