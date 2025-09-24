export default {
  coveragePathIgnorePatterns: ["<rootDir>/src/api-client"],
  moduleNameMapper: {
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
