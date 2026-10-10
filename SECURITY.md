# Security policy

Report vulnerabilities privately through GitHub Security Advisories. Do not open a public issue for an exploitable bypass or secret exposure. Maintainers will acknowledge reports within 5 business days and coordinate disclosure after a fix. Only the latest minor release is supported.

Agent Guard is defense in depth, not an OS security boundary. SDK and MCP enforcement applies only to operations routed through those APIs. Audit watchers cannot block access or reliably observe reads. Review `docs/THREAT_MODEL.md` before deployment.
