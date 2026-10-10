import { z } from "zod";

export const decisionSchema = z.enum(["allow", "deny", "ask"]);
export const operationSchema = z.enum(["read", "write", "create", "delete", "rename", "execute"]);
const operationPoliciesSchema = z.object({
  read: decisionSchema.default("allow"),
  write: decisionSchema.default("ask"),
  create: decisionSchema.default("ask"),
  delete: decisionSchema.default("deny"),
  rename: decisionSchema.default("ask"),
  execute: decisionSchema.default("deny"),
  outsideWorkspace: decisionSchema.default("deny"),
});

export const guardConfigSchema = z.object({
  workspace: z.string().min(1),
  allowedPaths: z.array(z.string().min(1)).default(["."]),
  deniedPaths: z.array(z.string().min(1)).default([".env", ".env.*", "secrets/**"]),
  policies: operationPoliciesSchema.partial().default({}),
  agentPolicies: z.record(z.string().min(1), operationPoliciesSchema.partial()).default({}),
  defaultDecision: decisionSchema.default("deny"),
  approval: z
    .object({
      timeoutMs: z.number().int().positive().default(30_000),
      defaultDecision: z.literal("deny").default("deny"),
      tokenTtlMs: z.number().int().positive().default(30_000),
    })
    .default({ timeoutMs: 30_000, defaultDecision: "deny", tokenTtlMs: 30_000 }),
  audit: z
    .object({
      enabled: z.boolean().default(true),
      redactSensitiveData: z.boolean().default(true),
      file: z.string().default(".agent-guard/audit.jsonl"),
      maxBytes: z.number().int().positive().default(5_000_000),
      retentionFiles: z.number().int().min(1).default(5),
    })
    .default({
      enabled: true,
      redactSensitiveData: true,
      file: ".agent-guard/audit.jsonl",
      maxBytes: 5_000_000,
      retentionFiles: 5,
    }),
  policyVersion: z.string().default("1"),
});

export type GuardConfigInput = z.input<typeof guardConfigSchema>;
export type GuardConfig = z.output<typeof guardConfigSchema>;

export function validateConfig(input: unknown): GuardConfig {
  return guardConfigSchema.parse(input);
}
