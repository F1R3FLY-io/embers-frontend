import type { Page } from "@playwright/test";

import { test as base, expect } from "@playwright/test";

import type { MockBackend } from "../mock-backend/server";

import { startMockBackend } from "../mock-backend/server";

/**
 * One mock backend per test, and an app pointed at it.
 *
 * The app reads its API address from `window.API_URL`, set by a `config.js`
 * loaded before the bundle. Intercepting that request is what lets each test
 * have its own server: nothing on disk is rewritten, so workers cannot clash,
 * and the same mechanism works in CI and locally.
 *
 * A wallet is signed in by seeding the key into the page before the app boots,
 * because the wallet lives in memory and there is no other way to arrive at a
 * signed-in state without driving the login form in every test.
 */

/** A throwaway key. It holds nothing and exists only in this repository. */
export const TEST_KEY_HEX =
  "0b4e1234567890abcdef0b4e1234567890abcdef0b4e1234567890abcdef0b4e";

interface Fixtures {
  backend: MockBackend;
  signIn: () => Promise<void>;
}

export const test = base.extend<Fixtures>({
  backend: async ({ page }, use) => {
    const backend = await startMockBackend();

    await page.route("**/config.js", async (route) =>
      route.fulfill({
        body: `window.API_URL = ${JSON.stringify(backend.url)}; window.FIRESKY_URL = "http://127.0.0.1:19006";`,
        contentType: "application/javascript",
      }),
    );

    await use(backend);
    await backend.close();
  },

  signIn: async ({ page }, use) => {
    await use(async () => {
      await page.goto("/login");
      await page.getByRole("button", { name: /sign in with/i }).click();
      await page.getByRole("textbox").first().fill(TEST_KEY_HEX);
      await page.getByRole("button", { name: /^sign in$/i }).click();
      await page.waitForURL("**/dashboard");
    });
  },
});

export { expect };

/**
 * Asserts a dialog is on screen and not covered by the loading overlay.
 *
 * This is the invariant behind the delete-confirmation bug: the spinner
 * renders above every modal, so a dialog opened while it is up cannot be
 * answered. Checking visibility alone is not enough -- the dialog IS visible,
 * it is simply unreachable -- so the overlay's absence is asserted too, and
 * callers then click a control inside the dialog, which Playwright refuses if
 * anything covers it.
 */
export async function expectDialogUnobstructed(page: Page) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.locator(".overlay")).toHaveCount(0);
  return dialog;
}
