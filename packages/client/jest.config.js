export default {
  // Generated code is excluded from the denominator, not from the tests. Both
  // directories are machine output -- the OpenAPI client and the ts-proto
  // protobuf bindings -- regenerated wholesale from their schemas. Counting
  // them would measure the generators rather than this package, and would push
  // the number around every time a schema changed. The hand-written wrappers
  // that USE them are counted, which is where a defect could actually live.
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/api-client/**",
    "!src/generated/**",
    "!src/**/*.d.ts",
  ],
  coveragePathIgnorePatterns: [
    "<rootDir>/src/api-client",
    "<rootDir>/src/generated",
  ],
  coverageThreshold: {
    global: { branches: 65, functions: 70, lines: 80, statements: 80 },
  },
  moduleNameMapper: {
    "^@$": "<rootDir>/src",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        tsconfig: "./tsconfig.tests.json",
        useESM: true,
      },
    ],
  },
  transformIgnorePatterns: [
    "../../node_modules/(?!(jest-runner|@noble|@scure)/)",
  ],
};
