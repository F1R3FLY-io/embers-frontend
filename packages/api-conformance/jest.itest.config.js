import base from "./jest.config.js";

/**
 * The live campaign: real requests against a running local stack.
 *
 * Serial by default and generously timed. One validator with one propose loop
 * means concurrency turns contention into flaky results attributed to the
 * wrong cause, and a single mutation can legitimately take two minutes.
 *
 * `globalSetup` decides availability before any test file is loaded, so a
 * scenario that cannot run is SKIPPED rather than passing while exercising
 * nothing.
 */
export default {
  ...base,
  collectCoverageFrom: undefined,
  coverageThreshold: undefined,
  globalSetup: "<rootDir>/src/globalSetup.ts",
  maxWorkers: 1,
  testMatch: ["<rootDir>/tests/**/*.itest.ts"],
  // 120s finalization budget, plus a slow read, plus slack.
  testTimeout: 190000,
};
