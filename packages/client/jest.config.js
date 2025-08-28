import { createDefaultEsmPreset } from "ts-jest";

const tsJestTransformCfg = createDefaultEsmPreset({
  tsconfig: "./tsconfig.json",
}).transform;

/** @type {import("jest").Config} **/
export default {
  coveragePathIgnorePatterns: ["<rootDir>/src/api-client"],
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
};
