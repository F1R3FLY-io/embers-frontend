import { createDefaultEsmPreset } from "ts-jest";

const tsJestTransformCfg = createDefaultEsmPreset({
  tsconfig: "./tsconfig.json",
  useESM: true,
}).transform;

/** @type {import("jest").Config} **/
export default {
  preset: "ts-jest/presets/default-esm",
  coveragePathIgnorePatterns: ["<rootDir>/src/api-client"],
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  transformIgnorePatterns: [
    "node_modules/(?!(@noble|@scure)/)"
  ],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  globals: {
    "ts-jest": {
      useESM: true,
      tsconfig: {
        module: "esnext",
        target: "esnext",
      }
    }
  },
  injectGlobals: true,
};
