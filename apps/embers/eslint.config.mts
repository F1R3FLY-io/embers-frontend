import tseslint from "typescript-eslint";

import baseConfig from "../../eslint.config.mts";

export default tseslint.config(
  baseConfig,
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "**/*.module.scss.d.ts",
    ],
  },
);
