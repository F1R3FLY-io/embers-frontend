import { globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

import baseConfig from "./eslint-base.config.mts";

export default tseslint.config(
  baseConfig,
  globalIgnores([
    "dist/**",
    "node_modules/**",
    "**/*.module.scss.d.ts",
  ]),
);