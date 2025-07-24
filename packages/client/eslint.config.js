import js from "@eslint/js";
import { globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config([
  globalIgnores(["docs/**", "mocks/**", "tests/**", "coverage/**"]),
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/*.module.scss.d.ts"],
    plugins: {
      import: importPlugin,
    },
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      {
        languageOptions: {
          parserOptions: {
            projectService: true,
            tsconfigRootDir: import.meta.url,
          },
        },
      },
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      "import/no-unresolved": "error",
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
          ],
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always",
        },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: ["apps/*/tsconfig.json", "packages/*/tsconfig.json"],
        },
      },
    },
  },
]);
