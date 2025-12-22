import { defineConfig, globalIgnores } from "eslint/config";

import baseConfig from "../../eslint.config.js";

export default defineConfig(
  baseConfig,
  globalIgnores(["**/*.module.d.scss.ts"]),
);
