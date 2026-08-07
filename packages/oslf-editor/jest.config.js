export default {
  // Measured over all source. The rendered editor -- injection, toolbox
  // chrome, gradients, the search element -- is excluded because jsdom
  // performs no layout and cannot exercise it honestly; it belongs to the
  // browser-level suite instead. What remains is the part that is testable
  // headlessly: block definitions, serialization, and code generation.
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/initEditor.ts",
    "!src/CustomRenderer.ts",
    "!src/CustomConstants.ts",
    "!src/theme.ts",
    "!src/gradients.ts",
    "!src/components/**",
  ],
  // Set to the measured figure, not an aspiration. The remaining gap is
  // src/index.ts -- editor init, toolbox regeneration, and the search filter --
  // which is reachable headlessly and is the obvious next target.
  coverageThreshold: {
    global: { branches: 28, functions: 28, lines: 25, statements: 25 },
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
};
