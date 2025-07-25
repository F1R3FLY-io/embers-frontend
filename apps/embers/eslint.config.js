import baseConfig from "../../eslint.config.js";

export default [
  ...baseConfig,
  {
    ignores: ["**/*.module.scss.d.ts"],
  },
];
