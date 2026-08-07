import { defineConfig, globalIgnores } from "eslint/config";

import baseConfig from "../eslint.config.js";

/**
 * The end-to-end workspace: Node and Playwright, with no React in it.
 *
 * The shared configuration is written for the application, so it carries the
 * React rule sets. Two of them misfire here rather than finding anything:
 * `rules-of-hooks` reads Playwright's fixture callback -- `async ({ page },
 * use) => ...` -- as a call to React 19's `use` hook, and `only-export-
 * components` has no components to reason about. Both are switched off for
 * this package rather than worked around at each call site, because the rules
 * simply do not apply to it.
 */
export default defineConfig(
  baseConfig,
  globalIgnores([
    "playwright-report",
    "test-results",
    // Captured media, written by the capture run.
    "../docs/usage/media",
  ]),
  {
    files: ["**/*.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "react-refresh/only-export-components": "off",
    },
  },
);
