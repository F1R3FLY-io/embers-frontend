import { defineConfig, devices } from "@playwright/test";

/**
 * Tier-1 end-to-end: the built application in a real browser, against a
 * stand-in backend.
 *
 * The app is served from its production build rather than the dev server, so
 * what is exercised is what ships -- including the code splitting and the
 * runtime `config.js` that decides which API to talk to. That file is
 * intercepted per test so each worker can point the app at its own mock,
 * which is what lets these run in parallel without a shared server.
 *
 * A second tier, against the real local stack, is deliberately a separate
 * project: it needs a running node and cannot be hermetic, so it must never
 * be what CI runs.
 */
export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  projects: [
    {
      name: "mock-desktop",
      // The tier-2 journeys share this testDir but must never run here: they
      // talk to a real node, and running them against the mock would assert
      // the contract against the thing that only imitates it.
      testIgnore: "**/stack/**",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { height: 800, width: 1280 },
      },
    },
    {
      // Tier 2: the real local stack. Never part of `e2e`, and never run by
      // CI. Each test skips with a message naming the missing precondition
      // unless EMBERS_E2E_STACK=1, EMBERS_E2E_STACK_KEY is set, and the
      // service answers -- so an accidental invocation reports why it did
      // nothing rather than failing as though the application were broken.
      name: "stack",
      testMatch: "**/stack/**",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { height: 800, width: 1280 },
      },
      // One chain mutation at a time: a single validator with one propose
      // loop, where concurrency turns into flaky results attributed to the
      // wrong cause.
      workers: 1,
    },
    {
      // Documentation media, not tests. NOT part of the `e2e` script, which
      // names the two test projects explicitly: `playwright test` with no
      // arguments would otherwise run this too, making the suite slower and
      // its result less meaningful. Run it with `pnpm capture:media`.
      name: "capture",
      testDir: "./capture",
      testMatch: "**/*.capture.ts",
      use: {
        ...devices["Desktop Chrome"],
        // Paced so a recording is legible rather than a blur of instant
        // transitions.
        launchOptions: { slowMo: 120 },
        viewport: { height: 800, width: 1280 },
      },
    },
    {
      name: "mock-mobile",
      // The project requires the interface to work on a phone, and a layout
      // that only ever runs at 1280px wide is how that stops being true.
      testMatch: ["**/responsive/**", "**/auth/**"],
      use: { ...devices["Pixel 7"] },
    },
  ],
  reporter:
    process.env.CI === undefined
      ? "list"
      : [["list"], ["html", { open: "never" }]],
  retries: process.env.CI === undefined ? 0 : 2,
  testDir: "./tests",
  use: {
    baseURL: "http://127.0.0.1:4273",
    screenshot: "only-on-failure",
    // Traces cost time, so they are kept for the retry rather than every run:
    // a test that fails twice is worth a trace, a flake is worth a rerun.
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  webServer: {
    // Bound to 127.0.0.1 explicitly: vite preview otherwise listens on
    // "localhost", which resolves to ::1 first on this platform, and the
    // readiness probe below asks for the IPv4 address.
    command:
      "pnpm --filter @f1r3fly-io/embers-frontend exec vite preview --port 4273 --strictPort --host 127.0.0.1",
    reuseExistingServer: process.env.CI === undefined,
    timeout: 60_000,
    url: "http://127.0.0.1:4273",
  },
  workers: process.env.CI === undefined ? undefined : 2,
});
