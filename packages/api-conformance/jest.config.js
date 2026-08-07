export default {
  collectCoverageFrom: ["src/**/*.ts"],
  coverageThreshold: {
    global: { branches: 70, functions: 75, lines: 80, statements: 80 },
  },
  moduleNameMapper: {
    "^@$": "<rootDir>/src",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  // The offline half only. The live campaign matches `*.itest.ts` and runs
  // under jest.itest.config.js, so `pnpm -r test` can never start a run that
  // needs a chain.
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      { tsconfig: "./tsconfig.tests.json", useESM: true },
    ],
  },
};
