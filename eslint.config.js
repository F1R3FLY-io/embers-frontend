import js from "@eslint/js";
import { globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import reactHooks from "eslint-plugin-react-hooks";
import reactPlugin from "eslint-plugin-react";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";
import perfectionist from "eslint-plugin-perfectionist";

export default tseslint.config([
  globalIgnores(["**/dist/**", "**/*.module.scss.d.ts"]),
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      reactPlugin,
      reactHooks,
      reactRefresh,
      import: importPlugin,
      perfectionist,
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
      reactPlugin.configs.flat.recommended,
      reactPlugin.configs.flat["jsx-runtime"],
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          reportUsedIgnorePattern: true,
        },
      ],
      "import/no-unresolved": "error",
      "react/jsx-sort-props": [
        "error",
        {
          callbacksLast: true,
          shorthandFirst: true,
          ignoreCase: true,
          noSortAlphabetically: false,
          reservedFirst: true,
        },
      ],
      "perfectionist/sort-exports": [
        "error",
        {
          type: "natural",
        },
      ],
      "perfectionist/sort-imports": [
        "error",
        {
          type: "natural",
        },
      ],
      "perfectionist/sort-interfaces": [
        "error",
        {
          type: "natural",
        },
      ],
      "perfectionist/sort-named-exports": [
        "error",
        {
          type: "natural",
        },
      ],
      "perfectionist/sort-named-imports": [
        "error",
        {
          type: "natural",
        },
      ],
      "perfectionist/sort-object-types": [
        "error",
        {
          type: "natural",
        },
      ],
      "perfectionist/sort-objects": [
        "error",
        {
          type: "natural",
        },
      ],
    },
    settings: {
      react: { version: "detect" },
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: ["apps/*/tsconfig.json", "packages/*/tsconfig.json"],
        },
      },
    },
  },
]);
