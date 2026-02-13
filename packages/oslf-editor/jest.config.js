export default {
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
