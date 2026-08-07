import type { Page } from "@playwright/test";

import { expect, test } from "../../support/fixtures";

/**
 * An agent from nothing to deployed, in a real browser.
 *
 * The point is the hand-offs. The identity an agent gets exists only in the
 * server's response to the first save, so failing to carry it back leaves the
 * editor believing it is still editing a new agent -- and the next save
 * creates a SECOND agent instead of a version. None of that is visible from a
 * test that stops at "the mutation was called".
 */

async function createAgent(page: Page, name: string) {
  await page.getByText(/create new agent/i).click();
  await page.getByPlaceholder("Agent name").fill(name);
  await page.getByRole("button", { name: /^continue$/i }).click();

  // Wait for the SKELETON, not for the save button. The header renders long
  // before the editor has loaded its grammar and seeded the document, and a
  // save in that window is refused -- correctly, since the editor has no text
  // to give. Waiting on the button produced a real flake that turned out to be
  // an application defect: before the refusal was added, that save wrote an
  // empty agent.
  await expect(page.getByRole("button", { name: /save changes/i })).toBeVisible(
    { timeout: 30_000 },
  );
  await expect(page.getByText(/contract main/).first()).toBeVisible({
    timeout: 30_000,
  });
}

test("creates an agent and lists it on the dashboard", async ({
  backend,
  page,
  signIn,
}) => {
  await signIn();
  await createAgent(page, "Researcher");

  await page.getByRole("button", { name: /save changes/i }).click();

  await expect
    .poll(() => backend.store.agents.length, { timeout: 30_000 })
    .toBe(1);
  expect(backend.store.agents[0].name).toBe("Researcher");
  // The editor seeds a skeleton for a new agent, so a save that sent nothing
  // would be visible here as empty code rather than as a failure.
  expect(backend.store.agents[0].code).not.toBe("");
});

test("adds a version rather than a second agent when saved again", async ({
  backend,
  page,
  signIn,
}) => {
  await signIn();
  await createAgent(page, "Researcher");

  await page.getByRole("button", { name: /save changes/i }).click();
  await expect
    .poll(() => backend.store.agents.length, { timeout: 30_000 })
    .toBe(1);
  const firstVersion = backend.store.agents[0].version;

  await page.getByRole("button", { name: /save changes/i }).click();

  // One agent, two versions. Creating a second agent here is the failure mode
  // that follows from losing the server-minted id after the first save.
  await expect
    .poll(
      () => backend.store.agentHistory.get(backend.store.agents[0].id)?.length,
      { timeout: 30_000 },
    )
    .toBe(2);
  expect(backend.store.agents).toHaveLength(1);
  expect(backend.store.agents[0].version).not.toBe(firstVersion);
});

test("deploys an agent and marks it as no longer a draft", async ({
  backend,
  page,
  signIn,
}) => {
  await signIn();
  await createAgent(page, "Researcher");

  await page.getByRole("button", { name: /^deploy$/i }).click();

  // The deploy page reviews the version about to ship. Reaching it at all
  // means the pre-deploy save succeeded -- it navigates only on success.
  await expect(page.getByRole("button", { name: /^back$/i })).toBeVisible({
    timeout: 30_000,
  });
  await expect
    .poll(() => backend.store.agents.length, { timeout: 30_000 })
    .toBe(1);

  await page
    .getByRole("button", { name: /^deploy$/i })
    .last()
    .click();

  await expect
    .poll(() => backend.store.agents[0]?.lastDeploy, { timeout: 30_000 })
    .toBeDefined();
});

test("offers a just-created agent to a team even though the list lagged", async ({
  backend,
  page,
  signIn,
}) => {
  await signIn();
  await createAgent(page, "Researcher");

  // The write is accepted before it is readable: the list answers 200 with the
  // view from before the save, for the next few reads. That is a successful
  // response carrying stale data, so nothing retries it on its own -- without
  // the polling reconciliation the agent stays missing until something else
  // happens to trigger a fetch.
  backend.store.staleReads.set("agents", 3);

  await page.getByRole("button", { name: /save changes/i }).click();
  await expect
    .poll(() => backend.store.agents.length, { timeout: 30_000 })
    .toBe(1);
  const agentId = backend.store.agents[0].id;

  // Back through the interface, because a page load would sign the wallet out.
  await page.getByRole("button", { name: /back to dashboard/i }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /confirm|yes|leave/i })
    .click();
  await expect(page.getByPlaceholder(/search agents/i)).toBeVisible();

  // The team palette reads the same list, and is where a missing agent is
  // actually noticed: an agent that cannot be seen cannot be added to a team.
  await page.getByRole("button", { name: /agent teams/i }).click();
  await page.getByText(/create new agent team/i).click();
  await page.getByPlaceholder("Agents Team name").fill("Research Desk");
  await page.getByRole("button", { name: /^continue$/i }).click();

  await expect(page.getByTestId(`sidebar-agent-${agentId}`)).toContainText(
    "Researcher",
  );
});
