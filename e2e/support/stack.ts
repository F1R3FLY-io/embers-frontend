import { test as base, expect } from "@playwright/test";

/**
 * Tier 2: the application against a REAL local node.
 *
 * The mock backend imitates the contract; this confirms it. Everything here
 * therefore avoids the mock entirely -- no `config.js` interception, so the
 * built application talks to whatever `window.API_URL` already names.
 *
 * It cannot be hermetic and it cannot be fast: a single mutation is
 * prepare, sign, send, and then a wait for the chain to finalize, which the
 * server budgets at 120 seconds. That is why this is a separate project that
 * CI never runs, and why every timeout here is measured in minutes.
 *
 * ## Refusing to run, loudly
 *
 * The failure mode this must avoid is running against a stack that is absent
 * or half-up and reporting the resulting mess as an application defect. So the
 * preflight checks each precondition separately and skips with a message
 * NAMING the one that failed. A skip that says "stack not available" sends the
 * reader to look at the wrong thing.
 */

/** How long a chain mutation may take: the server's own finalization budget. */
export const FINALIZATION_BUDGET_MS = 150_000;

interface StackFixtures {
  /** The API the built application is pointed at. */
  apiUrl: string;
  /** Signs the configured wallet in, and lands on the dashboard. */
  signIn: () => Promise<void>;
}

/**
 * What must be true before a single assertion is worth making.
 *
 * Returns the reason it is not, or undefined when everything holds. Each check
 * names its own remedy, because the person reading this in CI output is not
 * necessarily the person who set the environment up.
 */
async function preflight(apiUrl: string): Promise<string | undefined> {
  if (process.env.EMBERS_E2E_STACK !== "1") {
    return (
      "tier 2 is opt-in: set EMBERS_E2E_STACK=1 to run it. It needs a local " +
      "Embers stack and takes minutes rather than seconds, so it is never " +
      "what CI runs."
    );
  }

  if (process.env.EMBERS_E2E_STACK_KEY === undefined) {
    return (
      "EMBERS_E2E_STACK_KEY is not set. Tier 2 signs in with a real funded " +
      "wallet; give it the hexadecimal private key of one that can pay for " +
      "deploys. It is read from the environment rather than from a run " +
      "directory so that nothing here reaches outside the repository."
    );
  }

  try {
    const response = await fetch(`${apiUrl}/api/service/ready`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      return `the Embers service at ${apiUrl} answered ${String(response.status)} for /api/service/ready; it is up but not ready`;
    }
  } catch (error) {
    return (
      `the Embers service at ${apiUrl} is unreachable ` +
      `(${error instanceof Error ? error.message : String(error)}). ` +
      "Start the local stack, or point EMBERS_E2E_API_URL at a running one."
    );
  }

  return undefined;
}

export const test = base.extend<StackFixtures>({
  apiUrl: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, provide) => {
      // Defaults to what the shipped config.js names, so the common case needs
      // no configuration at all.
      await provide(process.env.EMBERS_E2E_API_URL ?? "http://[::1]:8080");
    },
    { scope: "test" },
  ],

  signIn: async ({ apiUrl, page }, provide) => {
    const blocked = await preflight(apiUrl);
    test.skip(blocked !== undefined, blocked ?? "");

    await provide(async () => {
      await page.goto("/login");
      await page.getByRole("button", { name: /sign in with/i }).click();
      await page
        .getByRole("textbox")
        .first()
        .fill(process.env.EMBERS_E2E_STACK_KEY ?? "");
      await page.getByRole("button", { name: /^sign in$/i }).click();
      await page.waitForURL("**/dashboard");
    });
  },
});

export { expect };

/**
 * A name no other run will produce.
 *
 * The chain is append-only and the list endpoints have no filter, so every run
 * adds to what previous runs left behind. Prefixing by run makes an assertion
 * about "the record this test created" answerable without depending on the
 * wallet being empty -- which it never is after the first run.
 */
export function uniqueName(prefix: string): string {
  const stamp = process.env.EMBERS_E2E_RUN_ID ?? String(Date.now());
  return `${prefix}-${stamp}-${String(Math.floor(Math.random() * 1e6))}`;
}
