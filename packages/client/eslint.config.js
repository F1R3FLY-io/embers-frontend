import globals from "globals";

import baseConfig from "../../eslint.config.js";

export default [
  ...baseConfig,
  {
    ignores: ["coverage/**", "docs/**", "mocks/**"],
  },
  {
    files: ["test-with-mocks.js"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
  },
];
