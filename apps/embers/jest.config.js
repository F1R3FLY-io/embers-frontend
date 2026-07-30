export default {
  moduleNameMapper: {
    // Assets Vite resolves but jest cannot parse. Without these, importing any
    // module that reaches a stylesheet or an icon fails before a test can run.
    // The svg mock is a component because `?react` imports are components.
    "\\.svg(\\?react)?$": "<rootDir>/tests/__mocks__/svgMock.tsx",
    "\\.(css|scss)$": "<rootDir>/tests/__mocks__/styleMock.js",
    "\\.(png|jpe?g|gif|webp|avif)$": "<rootDir>/tests/__mocks__/fileMock.js",
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
