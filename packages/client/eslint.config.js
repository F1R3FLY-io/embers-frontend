import baseConfig from "../../eslint.config.js";

export default [
  ...baseConfig,
  {
    ignores: [
      "dist/**",
      "src/api-client/**",
      "coverage/**",
      "docs/**",
      "mocks/**",
      "node_modules/**",
    ],
  },
];
