import { defineConfig } from "eslint/config";

import baseConfig from "../../eslint.config.js";

export default defineConfig(baseConfig, {
  files: ["src/**/*.{js,jsx,ts,tsx}", "tests/**/*.{js,jsx,ts,tsx}"],
  rules: {
    "@typescript-eslint/explicit-member-accessibility": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unnecessary-condition": "off",
    "@typescript-eslint/no-unsafe-argument": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "class-methods-use-this": "off",
  },
});
