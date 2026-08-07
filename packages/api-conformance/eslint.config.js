import { defineConfig, globalIgnores } from "eslint/config";

import baseConfig from "../../eslint.config.js";

/**
 * A Node package with no React in it, so the shared configuration's React rule
 * sets have nothing here to reason about.
 */
export default defineConfig(
  baseConfig,
  globalIgnores(["artifacts", "coverage"]),
  {
    files: ["**/*.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "react-refresh/only-export-components": "off",
    },
    settings: {
      // The `@/` alias is declared in the tsconfig; the import plugin needs to
      // be told which one, or every aliased import reads as unresolved.
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.tests.json",
        },
      },
    },
  },
);
