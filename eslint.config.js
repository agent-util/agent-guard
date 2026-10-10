import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "docs/.vitepress/cache/**",
      "docs/.vitepress/dist/**",
      "node_modules/**",
      "eslint.config.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ["scripts/*.mjs"] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: { "@typescript-eslint/require-await": "off" },
  },
  {
    files: ["scripts/*.mjs"],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
      globals: { console: "readonly", process: "readonly", setTimeout: "readonly" },
    },
  },
);
