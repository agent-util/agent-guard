---
layout: home

hero:
  name: Agent Guard
  text: Keep AI agents inside their boundaries.
  tagline: Enforce workspace policies, request human approval, and audit supported filesystem operations without overstating the security boundary.
  image:
    src: /logo.svg
    alt: Agent Guard shield
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started
    - theme: alt
      text: Security model
      link: /security/threat-model
    - theme: alt
      text: View on GitHub
      link: https://github.com/agent-util/agent-guard

features:
  - icon: 🛡️
    title: Boundary enforcement
    details: Canonical paths, symlink checks, deny-first rules, and default-deny handling outside the workspace.
  - icon: ✋
    title: Human approval
    details: Timeouts, operation-bound tokens, replay prevention, and resource revalidation before execution.
  - icon: 🔌
    title: SDK and MCP wrappers
    details: Actual prevention for operations routed through the Node.js filesystem or wrapped MCP tool APIs.
  - icon: 🧾
    title: Auditable decisions
    details: Structured JSONL records with redaction, rotation, session identifiers, and correlation IDs.
  - icon: 🚨
    title: Security events
    details: Typed events and opt-in terminal, webhook, desktop, and audit-only watcher integrations.
  - icon: 🔍
    title: Honest capabilities
    details: A clear distinction between SDK enforcement, agent hooks, OS sandboxes, and audit-only monitoring.
---

## Install

```bash
npm install @agent-utils/agent-guard
```

Agent Guard supports Node.js 20 or newer and ships ESM, CommonJS, and TypeScript declarations.

::: warning Security boundary
Agent Guard blocks only operations routed through a supported enforcing integration. It does not intercept unrelated processes or replace an operating-system sandbox.
:::
