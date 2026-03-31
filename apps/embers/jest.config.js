export default {
  moduleNameMapper: {
    "\\.module\\.scss$": "<rootDir>/tests/__mocks__/styleMock.js",
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
  transformIgnorePatterns: ["../../node_modules/(?!(dagre|@f1r3fly-io)/)"],
};
