import tseslint from "typescript-eslint";

import baseConfig from "../../eslint.config.mts";

// ESLint configuration for consist_pre-push_local-build branch
export default tseslint.config(
  baseConfig,
  {
    ignores: [
      "dist/**", // Build output directory
      "node_modules/**",
      "**/*.module.scss.d.ts",
    ],
  },
);
