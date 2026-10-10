import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: "dist",
    target: "node20",
  },
  {
    entry: ["src/cli/index.ts"],
    format: ["esm"],
    dts: false,
    sourcemap: true,
    target: "node20",
    outDir: "dist/cli",
    clean: false,
    banner: { js: "#!/usr/bin/env node" },
  },
]);
