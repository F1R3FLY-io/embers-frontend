import type { Page } from "@playwright/test";

import { connectHandles, dragAndDrop } from "../../support/dnd";
import { expect, test } from "../../support/fixtures";

/**
 * Deploying a team, and deploying it again after an edit.
 *
 * Re-deploying is the case that broke: once a team was deployed the primary
 * button became "Run", and deploying again had no entry point at all. The
 * caret beside it is where the action moved to, so what is asserted here is
 * that a deployed team can still be deployed -- which is what "I edited it and
 * cannot ship the change" means.
 */

const CANVAS = ".react-flow";

async function openNewTeam(page: Page, name: string) {
  await page.getByRole("button", { name: /agent teams/i }).click();
  await page.getByText(/create new agent team/i).click();
  await page.getByPlaceholder("Agents Team name").fill(name);
  await page.getByRole("button", { name: /^continue$/i }).click();
  await expect(page.locator(CANVAS)).toBeVisible();
}

/**
 * Builds the smallest workflow the validator accepts: an input feeding an
 * output. Anything less is refused at deploy, which is the documented split
 * between what may be saved as a draft and what may be published.
 */
async function drawMinimalWorkflow(page: Page) {
  const canvas = page.locator(CANVAS);
  await dragAndDrop(page, page.getByTestId("sidebar-node-input-node"), canvas, {
    x: 0.3,
    y: 0.4,
  });
  await dragAndDrop(
    page,
    page.getByTestId("sidebar-node-output-node"),
    canvas,
    {
      x: 0.75,
      y: 0.4,
    },
  );

  await expect(canvas.getByText("Input", { exact: true })).toBeVisible();
  await expect(canvas.getByText("Output", { exact: true })).toBeVisible();

  await connectHandles(
    page,
    canvas.locator(".react-flow__handle-right").first(),
    canvas.locator(".react-flow__handle-left").first(),
  );
  await expect(canvas.locator(".react-flow__edge")).toHaveCount(1);
}

test("deploys an assembled team and records its address", async ({
  backend,
  page,
  signIn,
}) => {
  await signIn();
  await openNewTeam(page, "Research Desk");
  await drawMinimalWorkflow(page);

  await page.getByRole("button", { name: /^deploy$/i }).click();

  // The deploy page reviews what is about to ship before it ships.
  await expect(page.getByRole("button", { name: /^back$/i })).toBeVisible();
  await page
    .getByRole("button", { name: /^deploy$/i })
    .last()
    .click();

  await expect
    .poll(() => backend.store.teams[0]?.lastDeploy, { timeout: 30_000 })
    .toBeDefined();

  // A deployed team has an address; a team that failed to deploy must not.
  expect(backend.store.teams[0].uri).toMatch(/^rho:id:/);
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("refuses to deploy a canvas the validator rejects, and says so", async ({
  backend,
  page,
  signIn,
}) => {
  void backend;
  await signIn();
  await openNewTeam(page, "Research Desk");

  // One node, unconnected: savable as a draft, not publishable.
  await dragAndDrop(
    page,
    page.getByTestId("sidebar-node-compress"),
    page.locator(CANVAS),
  );
  await expect(
    page.locator(CANVAS).getByText("Compress", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: /^deploy$/i }).click();

  // Still in the editor, with the reason in the dock -- not on a deploy page
  // offering to ship something that cannot be built.
  await expect(page.locator(CANVAS)).toBeVisible();
  await expect(page.getByText(/pre-deploy save failed/i)).toBeVisible();
});

test("keeps deploying reachable after a team has been deployed", async ({
  backend,
  page,
  signIn,
}) => {
  // A team that is already deployed, opened from the dashboard. Its recorded
  // address is what makes the editor offer Run instead of Deploy.
  const team = backend.store.addTeam({
    id: "team-1",
    lastDeploy: Date.now(),
    name: "Research Desk",
    uri: "seeded",
  });
  // Replaced with a real registry URI: the client parses it on the way in, so
  // a placeholder would be rejected before the page rendered.
  const { newTeamUri } = await import("../../mock-backend/keys");
  team.uri = newTeamUri();

  await signIn();
  await page.getByRole("button", { name: /agent teams/i }).click();
  await page.getByText("Research Desk").click();
  await expect(page.locator(CANVAS)).toBeVisible();

  // The primary action is Run, because there is nothing unsaved to deploy.
  await expect(page.getByRole("button", { name: /^run$/i })).toBeVisible();

  // Deploying has not disappeared -- it moved under the caret. Without this
  // the only way to ship an edit was to make an edit first, which is exactly
  // the trap: an unchanged team could never be re-deployed.
  await page.getByRole("button", { name: /more actions/i }).click();
  await expect(page.getByRole("menuitem", { name: /^deploy$/i })).toBeVisible();
  await expect(
    page.getByRole("menuitem", { name: /publish to f1r3sky/i }),
  ).toBeVisible();
});

test("offers Deploy again as soon as the graph is edited", async ({
  backend,
  page,
  signIn,
}) => {
  const team = backend.store.addTeam({
    id: "team-1",
    lastDeploy: Date.now(),
    name: "Research Desk",
  });
  const { newTeamUri } = await import("../../mock-backend/keys");
  team.uri = newTeamUri();

  await signIn();
  await page.getByRole("button", { name: /agent teams/i }).click();
  await page.getByText("Research Desk").click();
  await expect(page.locator(CANVAS)).toBeVisible();
  await expect(page.getByRole("button", { name: /^run$/i })).toBeVisible();

  await dragAndDrop(
    page,
    page.getByTestId("sidebar-node-input-node"),
    page.locator(CANVAS),
  );

  // An unsaved edit means what is deployed is no longer what is on screen, so
  // the primary action must go back to Deploy rather than offering to run a
  // build the author can no longer see.
  await expect(page.getByRole("button", { name: /^deploy$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /^run$/i })).toHaveCount(0);
});
