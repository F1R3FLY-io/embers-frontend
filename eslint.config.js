import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import jest from "eslint-plugin-jest";
import perfectionist from "eslint-plugin-perfectionist";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export const JS_FILES = "**/*.{js,jsx}";
export const TS_FILES = "**/*.{ts,tsx}";

export default defineConfig(
  globalIgnores(["dist", "node_modules"]),
  {
    extends: [
      js.configs.recommended,
      reactPlugin.configs.flat.recommended,
      reactPlugin.configs.flat["jsx-runtime"],
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.recommended,
      reactRefresh.configs.vite,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
      importPlugin.flatConfigs.react,
    ],
    files: [JS_FILES, TS_FILES],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error",
    },
    plugins: { perfectionist },
    rules: {
      "class-methods-use-this": [
        "error",
        {
          exceptMethods: [
            "componentDidCatch",
            "componentDidMount",
            "componentWillUnmount",
            "render",
          ],
        },
      ],
      curly: ["error", "all"],
      "default-case-last": "error",
      "default-param-last": "error",
      "dot-notation": ["error", { allowKeywords: true }],
      eqeqeq: "error",
      "func-style": ["error", "declaration", { allowArrowFunctions: true }],
      "grouped-accessor-pairs": [
        "error",
        "getBeforeSet",
        { enforceForTSTypes: true },
      ],
      "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "import/extensions": [
        "error",
        "ignorePackages",
        {
          ts: "never",
          tsx: "never",
        },
      ],
      "import/no-duplicates": "error",
      "import/no-named-as-default": "off",
      "import/no-named-as-default-member": "off",
      "import/no-unresolved": "error",
      "logical-assignment-operators": "error",
      "no-alert": "error",
      "no-await-in-loop": "error",
      "no-console": "error",
      "no-constructor-return": "error",
      "no-else-return": "error",
      "no-empty-function": ["error", { allow: ["arrowFunctions"] }],
      "no-eval": "error",
      "no-extend-native": "error",
      "no-extra-label": "error",
      "no-implied-eval": "error",
      "no-invalid-this": "error",
      "no-label-var": "error",
      "no-lone-blocks": "error",
      "no-lonely-if": "error",
      "no-loop-func": "error",
      "no-multi-assign": "error",
      "no-new": "error",
      "no-new-wrappers": "error",
      "no-object-constructor": "error",
      "no-promise-executor-return": "error",
      "no-return-assign": "error",
      "no-script-url": "error",
      "no-self-compare": "error",
      "no-sequences": "error",
      "no-template-curly-in-string": "error",
      "no-throw-literal": "error",
      "no-unassigned-vars": "error",
      "no-unmodified-loop-condition": "error",
      "no-unneeded-ternary": "error",
      "no-unreachable-loop": "error",
      "no-unused-expressions": [
        "error",
        { allowShortCircuit: true, enforceForJSX: true },
      ],
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          reportUsedIgnorePattern: true,
          varsIgnorePattern: "^_",
        },
      ],
      "no-use-before-define": [
        "error",
        { classes: false, enums: false, functions: false, variables: true },
      ],
      "no-useless-assignment": "error",
      "no-useless-call": "error",
      "no-useless-computed-key": "error",
      "no-useless-concat": "error",
      "no-useless-constructor": "error",
      "no-useless-rename": "error",
      "no-useless-return": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "perfectionist/sort-array-includes": [
        "error",
        {
          type: "natural",
        },
      ],
      "perfectionist/sort-enums": [
        "error",
        {
          type: "natural",
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
          sortSideEffects: true,
          type: "natural",
        },
      ],
      "perfectionist/sort-interfaces": [
        "error",
        {
          type: "natural",
        },
      ],
      "perfectionist/sort-maps": [
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
      "perfectionist/sort-sets": [
        "error",
        {
          type: "natural",
        },
      ],
      "prefer-arrow-callback": "error",
      "prefer-const": "error",
      "prefer-promise-reject-errors": "error",
      "prefer-template": "error",
      "react-hooks/set-state-in-effect": "off",
      "react/jsx-curly-brace-presence": ["error", "never"],
      "react/jsx-no-useless-fragment": "error",
      "react/jsx-sort-props": [
        "error",
        {
          callbacksLast: true,
          ignoreCase: true,
          noSortAlphabetically: false,
          reservedFirst: true,
          shorthandFirst: true,
        },
      ],
      "react/self-closing-comp": "error",
      "require-await": "error",
      yoda: "error",
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "**/tsconfig.json",
        },
      },
      react: { version: "detect" },
    },
  },
  {
    extends: [
      tseslint.configs.eslintRecommended,
      tseslint.configs.recommendedTypeChecked,
    ],
    files: [TS_FILES],
    rules: {
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          fixStyle: "separate-type-imports",
          prefer: "type-imports",
        },
      ],
      "@typescript-eslint/dot-notation": ["error", { allowKeywords: true }],
      "@typescript-eslint/explicit-member-accessibility": [
        "error",
        { accessibility: "explicit" },
      ],
      "@typescript-eslint/method-signature-style": "error",
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        { ignoreArrowShorthand: true },
      ],
      "@typescript-eslint/no-deprecated": "error",
      "@typescript-eslint/no-dynamic-delete": "error",
      "@typescript-eslint/no-extraneous-class": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-invalid-void-type": "error",
      "@typescript-eslint/no-meaningless-void-operator": "error",
      "@typescript-eslint/no-misused-spread": "error",
      "@typescript-eslint/no-mixed-enums": "error",
      "@typescript-eslint/no-non-null-asserted-nullish-coalescing": "error",
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/no-unnecessary-parameter-property-assignment":
        "error",
      "@typescript-eslint/no-unnecessary-qualifier": "error",
      "@typescript-eslint/no-unnecessary-template-expression": "error",
      "@typescript-eslint/no-unnecessary-type-arguments": "error",
      "@typescript-eslint/no-unnecessary-type-conversion": "error",
      "@typescript-eslint/no-unnecessary-type-parameters": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          reportUsedIgnorePattern: true,
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-useless-empty-export": "error",
      "@typescript-eslint/prefer-literal-enum-member": "error",
      "@typescript-eslint/prefer-reduce-type-parameter": "error",
      "@typescript-eslint/prefer-return-this-type": "error",
      "@typescript-eslint/promise-function-async": "error",
      "@typescript-eslint/related-getter-setter-pairs": "error",
      "@typescript-eslint/return-await": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "dot-notation": "off",
    },
  },
  {
    extends: [jest.configs["flat/recommended"], jest.configs["flat/style"]],
    files: ["**/*.test.{js,jsx,ts,tsx}"],
  },
  {
    files: ["**/eslint.config.{js,ts}"],
    languageOptions: {
      globals: globals.node,
    },
  },
);
