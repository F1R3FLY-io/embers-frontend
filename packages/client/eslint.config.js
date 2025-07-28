import { globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

import baseConfig from "../../eslint.config.js";

export default tseslint.config(
  baseConfig,
  globalIgnores(["coverage", "docs", "mocks"]),
  {
    files: ["test-with-mocks.js"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "no-console": "off",
    },
  },
);
