import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "en-US",
  title: "Agent Guard",
  titleTemplate: ":title · Agent Guard",
  description:
    "Security policies, approval workflows, and audit tooling for supported AI agent filesystem operations.",
  base: "/agent-guard/",
  cleanUrls: true,
  lastUpdated: true,
  sitemap: { hostname: "https://agent-util.github.io/agent-guard/" },
  head: [
    ["meta", { name: "theme-color", content: "#14b8a6" }],
    ["link", { rel: "icon", href: "/agent-guard/logo.svg", type: "image/svg+xml" }],
  ],
  themeConfig: {
    logo: "/logo.svg",
    siteTitle: "Agent Guard",
    search: { provider: "local" },
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Reference", link: "/reference/configuration" },
      { text: "Security", link: "/security/threat-model" },
      {
        text: "Community",
        items: [
          { text: "Contributing", link: "/community/contributing" },
          { text: "Support", link: "/community/support" },
          { text: "Releasing", link: "/community/releasing" },
        ],
      },
      { text: "v0.1.1", link: "https://www.npmjs.com/package/@agent-utils/agent-guard" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Introduction", link: "/guide/introduction" },
          { text: "Getting started", link: "/guide/getting-started" },
          { text: "Node.js agents", link: "/guide/node-agents" },
          { text: "MCP tools", link: "/guide/mcp" },
          { text: "Approvals & events", link: "/guide/approvals-events" },
          { text: "CLI", link: "/guide/cli" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "Configuration", link: "/reference/configuration" },
          { text: "API", link: "/reference/api" },
          { text: "Capability matrix", link: "/reference/capabilities" },
        ],
      },
      {
        text: "Security",
        items: [
          { text: "Architecture", link: "/security/architecture" },
          { text: "Threat model", link: "/security/threat-model" },
          { text: "Known limitations", link: "/security/limitations" },
        ],
      },
      {
        text: "Community",
        items: [
          { text: "Contributing", link: "/community/contributing" },
          { text: "Support", link: "/community/support" },
          { text: "Maintainers", link: "/community/maintainers" },
          { text: "Releasing", link: "/community/releasing" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/agent-util/agent-guard" },
      { icon: "npm", link: "https://www.npmjs.com/package/@agent-utils/agent-guard" },
    ],
    editLink: {
      pattern: "https://github.com/agent-util/agent-guard/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 Agent Utils contributors",
    },
    outline: { level: [2, 3], label: "On this page" },
  },
});
