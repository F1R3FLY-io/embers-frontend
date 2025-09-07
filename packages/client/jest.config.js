import { createDefaultEsmPreset } from "ts-jest";

const tsJestTransformCfg = createDefaultEsmPreset({
  tsconfig: "./tsconfig.json",
  useESM: true,
}).transform;

/** @type {import("jest").Config} **/
export default {
  coveragePathIgnorePatterns: ["<rootDir>/src/api-client"],
  extensionsToTreatAsEsm: [".ts"],
  globals: {
    "ts-jest": {
      tsconfig: {
        module: "esnext",
        target: "esnext",
      },
      useESM: true,
    },
  },
  injectGlobals: true,
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  transformIgnorePatterns: ["node_modules/(?!(@noble|@scure)/)"],
};
