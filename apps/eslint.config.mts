import tseslint from "typescript-eslint";

import baseConfig from "./eslint-base.config.mts";

const config = tseslint.config(
  baseConfig,
  {
    ignores: [
      "dist/**",
      "embers/dist/**", 
      "node_modules/**",
      "**/*.module.scss.d.ts",
    ],
  },
);

export default config;