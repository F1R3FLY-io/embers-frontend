import unusedImports from "eslint-plugin-unused-imports";
import { defineConfig, globalIgnores } from "eslint/config";

import baseConfig from "../../eslint.config.js";

export default defineConfig(
  baseConfig,
  globalIgnores(["coverage", "docs", "src/generated"]),
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: "off",
      reportUnusedInlineConfigs: "off",
    },
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "@typescript-eslint/explicit-member-accessibility": "off",
      "@typescript-eslint/no-dynamic-delete": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-invalid-void-type": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unnecessary-type-conversion": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/prefer-as-const": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
      "class-methods-use-this": "off",
      eqeqeq: "off",
      "no-await-in-loop": "off",
      "no-control-regex": "off",
      "no-useless-escape": "off",
      "unused-imports/no-unused-imports": "error",
    },
  },
);
