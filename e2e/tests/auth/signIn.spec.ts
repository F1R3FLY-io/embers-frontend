import { expect, test } from "../../support/fixtures";

// Signing in, and the guards around it.
//
// The first end-to-end coverage of anything: until now the wallet, the route
// guards, and the redirect all had unit tests but had never been exercised
// together in a browser against a real bundle.

test("turns an unauthenticated visitor away from the dashboard", async ({
  backend,
  page,
}) => {
  void backend;
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login$/);
});

test("sends the root to sign-in when no wallet is loaded", async ({
  backend,
  page,
}) => {
  void backend;
  await page.goto("/");

  // The inverted redirect fixed in this campaign sent SIGNED-IN users here
  // instead; this is the other half of that contract, in a real browser.
  await expect(page).toHaveURL(/\/login$/);
});

test("signs in with a private key and lands on the dashboard", async ({
  backend,
  page,
  signIn,
}) => {
  void backend;
  await signIn();

  await expect(page).toHaveURL(/\/dashboard$/);
});

test("signs the user out when the page is reloaded", async ({
  backend,
  page,
  signIn,
}) => {
  void backend;
  await signIn();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.reload();

  // The wallet is held in memory and nowhere else: no localStorage, no cookie.
  // So a reload -- or any full navigation -- ends the session and the guard
  // sends the user back to sign in.
  //
  // Worth stating plainly, because it is surprising: refreshing loses the
  // session, and a bookmarked deep link never opens signed in. It is also why
  // the Home redirect fixed in this campaign cannot be reached by navigating
  // to "/" in a browser after signing in -- the navigation signs the user out
  // first. That redirect is covered at the component level by the app's
  // routeRedirects suite.
  await expect(page).toHaveURL(/\/login$/);
});
