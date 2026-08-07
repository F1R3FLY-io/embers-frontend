import { expect, test } from "../../support/fixtures";

// The dashboard as a user experiences it: finding things, and being told the
// truth about what happened to them.

test("finds a record by typing part of its name", async ({
  backend,
  page,
  signIn,
}) => {
  backend.store.addAgent({ id: "a1", name: "Researcher" });
  backend.store.addAgent({ id: "a2", name: "Archivist" });
  await signIn();

  // "arch" would match Rese-arch-er too; the query has to distinguish them.
  // Addressed by its placeholder rather than by position: the header also
  // carries a language control, and the first textbox is not guaranteed to be
  // the search field.
  await page.getByPlaceholder(/search agents/i).fill("archiv");

  await expect(page.getByText("Archivist")).toBeVisible();
  await expect(page.getByText("Researcher")).toHaveCount(0);
});

test("remembers which tab was open across a fresh visit", async ({
  backend,
  page,
  signIn,
}) => {
  backend.store.addTeam({ id: "team-1", name: "Research Desk" });
  await signIn();

  await page.getByRole("button", { name: /agent teams/i }).click();
  await expect(page.getByText("Research Desk")).toBeVisible();

  // A reload signs the wallet out, so this signs back in -- which is the real
  // path a returning user takes, and the one the persisted tab is for.
  await page.reload();
  await page.getByRole("button", { name: /sign in with/i }).click();
  await page
    .getByRole("textbox")
    .first()
    .fill("0b4e1234567890abcdef0b4e1234567890abcdef0b4e1234567890abcdef0b4e");
  await page.getByRole("button", { name: /^sign in$/i }).click();

  // Back on the tab they left, not reset to the first one.
  await expect(page.getByText("Research Desk")).toBeVisible();
});

test("keeps a deleted record gone while the list still reports it", async ({
  backend,
  page,
  signIn,
}) => {
  backend.store.addAgent({ id: "a1", name: "Researcher" });
  await signIn();
  await expect(page.getByText("Researcher")).toBeVisible();

  // The server accepts the delete but keeps serving the pre-delete view for
  // the next few reads -- an observer node trailing the validator. The app
  // reconciles by polling until the record is really gone; without that, a
  // deleted row reappears on the next refetch.
  //
  // Only reachable through a delete the APP performs: the polling is part of
  // the mutation, so mutating the store directly would exercise the fixture
  // rather than the application.
  backend.store.staleReads.set("agents", 3);

  await page
    .getByTitle(/delete/i)
    .filter({ visible: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /confirm|delete|yes/i }).click();

  await expect(page.getByText("Researcher")).toHaveCount(0, {
    timeout: 20_000,
  });
  // Polled, not asserted outright: the row leaves the screen optimistically,
  // before the request that removes it has finished. Checking the server
  // synchronously here would be racing the very request under test.
  await expect
    .poll(() => backend.store.agents.length, { timeout: 20_000 })
    .toBe(0);
});

test("puts a rejected deletion back and says why", async ({
  backend,
  page,
  signIn,
}) => {
  backend.store.addAgent({ id: "a1", name: "Researcher" });
  backend.store.failures.set("/delete/send", {
    description: "the chain rejected this delete",
    status: 400,
  });
  await signIn();

  await page
    .getByTitle(/delete/i)
    .filter({ visible: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /confirm|delete|yes/i }).click();

  // The row is removed optimistically. When the chain refuses, it has to come
  // back AND the user has to be told -- otherwise the record appears to vanish
  // and then silently returns on some later refetch, with nothing to explain
  // either event.
  await expect(page.getByRole("dialog")).toContainText(/failed|rejected/i, {
    timeout: 20_000,
  });
  await expect(page.getByText("Researcher")).toBeVisible();
});
