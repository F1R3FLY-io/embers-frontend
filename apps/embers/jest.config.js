export default {
  // Coverage is measured over source the tests could reasonably reach.
  // Excluded: the entry point (it only mounts the app), generated style
  // typings, translation catalogues (data, not logic), and the Vite-only HMR
  // shim, which is replaced by a mock in every test by necessity.
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/main.tsx",
    "!src/vite-env.d.ts",
    "!src/**/*.d.ts",
    "!src/**/*.module.d.scss.ts",
    "!src/i18n/**",
    "!src/lib/viteHmr.ts",
  ],
  // Set just below what the suite currently achieves, so a drop fails rather
  // than passing quietly. Raise them as coverage rises; never lower them.
  //
  // These are measured over ALL source above, including files no test imports.
  // That denominator is larger and less flattering than the default one, which
  // counts only files some test happened to load -- a number that rises when
  // tests are DELETED. The honest figure is the one worth ratcheting.
  coverageThreshold: {
    global: { branches: 56, functions: 50, lines: 65, statements: 65 },
  },
  moduleNameMapper: {
    "\\.(css|scss)$": "<rootDir>/tests/__mocks__/styleMock.js",
    "\\.(png|jpe?g|gif|webp|avif)$": "<rootDir>/tests/__mocks__/fileMock.js",
    // Assets Vite resolves but jest cannot parse. Without these, importing any
    // module that reaches a stylesheet or an icon fails before a test can run.
    // The svg mock is a component because `?react` imports are components.
    "\\.svg(\\?react)?$": "<rootDir>/tests/__mocks__/svgMock.tsx",
    // Vite-only modules: they contain `import.meta`, which the CommonJS test
    // transform cannot parse. Order-sensitive: these specific mappings must
    // precede the generic @/ alias or jest never applies them. `@/i18n` is
    // matched exactly so that `@/i18n/en.json` still resolves normally, which
    // is what the replacement itself imports.
    "^@/i18n$": "<rootDir>/tests/__mocks__/i18nMock.ts",
    "^@/lib/viteHmr$": "<rootDir>/tests/__mocks__/viteHmrMock.ts",
    // Resolve the SDK to its SOURCE rather than its bundle. The built package
    // inlines the WebAssembly parser, so the stub above cannot reach it and a
    // test that imports the SDK loads real WASM. Against the source, the stub
    // applies and the SDK's own code -- protocol, signing, entities -- still
    // runs for real. Suites that mock the SDK module wholesale are unaffected.
    "^@f1r3fly-io/embers-client-sdk$":
      "<rootDir>/../../packages/client/src/index.ts",

    // The SDK initializes this WebAssembly parser at import time, which jsdom
    // cannot load. Stubbing the parser rather than the whole SDK lets suites
    // exercise the real client; see the mock for what it does and does not
    // stand in for.
    "^@f1r3fly-io/graphl-parser$":
      "<rootDir>/tests/__mocks__/graphlParserMock.ts",
    // eslint-disable-next-line perfectionist/sort-objects
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  preset: "ts-jest/presets/default-esm",
  // Supplies the web globals jsdom omits, before any test module is evaluated.
  setupFiles: ["<rootDir>/tests/helpers/setupGlobals.ts"],
  // Registers DOM matchers once the framework's `expect` exists.
  setupFilesAfterEnv: ["<rootDir>/tests/helpers/setupTests.ts"],
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
