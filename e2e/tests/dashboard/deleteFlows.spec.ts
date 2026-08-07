import { expect, expectDialogUnobstructed, test } from "../../support/fixtures";

// Deleting from the dashboard, in a real browser.
//
// This is the flow that produced the bug this campaign started from: the
// loading overlay covered the confirmation dialog, so the Confirm button could
// not be clicked and the deletion could never complete. Unit tests pin the
// ORDER the flow runs in; only a browser can show that the button is actually
// reachable, because "covered by an overlay" is a rendering fact rather than a
// call-ordering one.

test.beforeEach(({ backend }) => {
  backend.store.addAgent({ id: "agent-1", name: "Researcher" });
});

test("asks before deleting an agent, with the dialog reachable", async ({
  backend,
  page,
  signIn,
}) => {
  void backend;
  await signIn();

  await page
    .getByTitle(/delete/i)
    .filter({ visible: true })
    .first()
    .click();

  // The whole point: visible AND not covered. Clicking through it below is the
  // second half of the check -- Playwright refuses a click on a covered
  // element, so a returning overlay fails here rather than passing silently.
  const dialog = await expectDialogUnobstructed(page);
  await expect(dialog).toContainText(/Researcher/);
});

test("removes the agent once the deletion is confirmed", async ({
  backend,
  page,
  signIn,
}) => {
  await signIn();

  await page
    .getByTitle(/delete/i)
    .filter({ visible: true })
    .first()
    .click();
  const dialog = await expectDialogUnobstructed(page);
  await dialog.getByRole("button", { name: /confirm|delete|yes/i }).click();

  // Gone from the server, not merely from the screen: an optimistic removal
  // that was never sent would look identical in the browser.
  await expect
    .poll(() => backend.store.agents.length, { timeout: 15_000 })
    .toBe(0);
});

test("keeps the dialog reachable while the referencing check is slow", async ({
  backend,
  page,
  signIn,
}) => {
  // The read runs under the loading overlay, and the dialog opens after it.
  // Slowing the read widens the window in which the overlay is up, which is
  // exactly the state the original bug left behind permanently.
  await page.route("**/referencing/**", async (route) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 1200);
    });
    await route.continue();
  });
  void backend;
  await signIn();

  await page
    .getByTitle(/delete/i)
    .filter({ visible: true })
    .first()
    .click();

  await expectDialogUnobstructed(page);
});

test("declining leaves the agent alone", async ({ backend, page, signIn }) => {
  await signIn();

  await page
    .getByTitle(/delete/i)
    .filter({ visible: true })
    .first()
    .click();
  const dialog = await expectDialogUnobstructed(page);
  await dialog.getByRole("button", { name: /cancel|no/i }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(backend.store.agents).toHaveLength(1);
});

test("asks before deleting a team, with the dialog reachable", async ({
  backend,
  page,
  signIn,
}) => {
  backend.store.addTeam({ id: "team-1", name: "Research Desk" });
  await signIn();

  await page.getByRole("button", { name: /agent teams/i }).click();
  // The card must exist before its delete control can be reached. The delete
  // locator is also filtered to VISIBLE elements: the tab that was open before
  // stays mounted behind the new one, so its delete control still matches by
  // title and would otherwise be clicked instead.
  await expect(page.getByText("Research Desk")).toBeVisible();
  await page
    .getByTitle(/delete/i)
    .filter({ visible: true })
    .first()
    .click();

  // The teams tab carried the overlay bug for longer than the agents tab: the
  // original fix corrected one call site and nothing prevented the other. This
  // is the browser-level guard that the correction is real on both.
  const dialog = await expectDialogUnobstructed(page);
  await expect(dialog).toContainText(/Research Desk/);
});

test("removes the team once the deletion is confirmed", async ({
  backend,
  page,
  signIn,
}) => {
  backend.store.addTeam({ id: "team-1", name: "Research Desk" });
  await signIn();

  await page.getByRole("button", { name: /agent teams/i }).click();
  await expect(page.getByText("Research Desk")).toBeVisible();
  await page
    .getByTitle(/delete/i)
    .filter({ visible: true })
    .first()
    .click();
  const dialog = await expectDialogUnobstructed(page);
  await dialog.getByRole("button", { name: /confirm|delete|yes/i }).click();

  await expect
    .poll(() => backend.store.teams.length, { timeout: 15_000 })
    .toBe(0);
});

test("warns which teams a deletion would break", async ({
  backend,
  page,
  signIn,
}) => {
  backend.store.addTeam({
    agentIds: ["agent-1"],
    id: "team-1",
    name: "Research Desk",
  });
  await signIn();

  await page
    .getByTitle(/delete/i)
    .filter({ visible: true })
    .first()
    .click();

  // Deleting an agent a team uses is what used to break that team's
  // deployability with nothing said in advance. The dialog now names the team
  // that would be affected.
  const dialog = await expectDialogUnobstructed(page);
  await expect(dialog).toContainText(/Research Desk/);
});

test("keeps the delete control clickable on every card type", async ({
  backend,
  page,
  signIn,
}) => {
  backend.store.addTeam({ id: "team-1", name: "Research Desk" });
  await signIn();

  // An agent card and a team card differ by one button: the team's action row
  // also carries Publish. That extra button squeezed the delete icon -- a flex
  // item with a width attribute but no shrink rule -- down to ZERO pixels
  // wide. It stayed `visibility: visible` and stayed in the document, so
  // nothing looked broken; teams simply could not be deleted.
  //
  // Asserting the measured size rather than visibility alone, because the
  // element passed every ordinary "is it there" check while being unclickable.
  const agentIcon = page
    .getByTitle(/delete/i)
    .filter({ visible: true })
    .first();
  const agentBox = await agentIcon.boundingBox();
  expect(agentBox?.width).toBeGreaterThan(0);

  await page.getByRole("button", { name: /agent teams/i }).click();
  await expect(page.getByText("Research Desk")).toBeVisible();

  const teamIcon = page
    .getByTitle(/delete/i)
    .filter({ visible: true })
    .first();
  const teamBox = await teamIcon.boundingBox();
  expect(teamBox?.width).toBeGreaterThan(0);
  expect(teamBox?.width).toBe(agentBox?.width);
});
