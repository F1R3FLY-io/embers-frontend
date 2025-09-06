import { globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

import baseConfig from "./eslint-base.config.mts";

export default tseslint.config(
  baseConfig,
  globalIgnores([
    "dist/**",
    "node_modules/**",
    "**/*.module.scss.d.ts",
    // Ignore test-ui app for now since it has different dependencies
    "src/**",
    // Ignore vite config as it has external dependencies
    "vite.config.ts",
    "index.html",
  ]),
);