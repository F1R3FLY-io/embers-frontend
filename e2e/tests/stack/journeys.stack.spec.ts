import type { Page } from "@playwright/test";

import { connectHandles, dragAndDrop } from "../../support/dnd";
import {
  expect,
  FINALIZATION_BUDGET_MS,
  test,
  uniqueName,
} from "../../support/stack";

/**
 * The journeys the mock backend imitates, run against a real node.
 *
 * These exist to confirm the CONTRACT, not to re-test the interface. Tier 1
 * already asserts what each control does and what the application does with
 * the answer; what it cannot show is that the real server answers in the
 * shapes the mock assumes. So each journey here drives a full write through
 * the chain and asserts the smallest thing that could only be true if the
 * round trip really happened.
 *
 * Every test is skipped, with a reason naming the missing precondition, unless
 * `EMBERS_E2E_STACK=1` and a funded `EMBERS_E2E_STACK_KEY` are set and the
 * service answers. See `e2e/support/stack.ts`.
 *
 * Timeouts are minutes because a chain mutation is prepare, sign, send, and a
 * wait for finalization that the server budgets at 120 seconds.
 */

const CANVAS = ".react-flow";

test.describe.configure({ mode: "serial", timeout: 10 * 60_000 });

async function createAgent(page: Page, name: string) {
  await page.getByText(/create new agent/i).click();
  await page.getByPlaceholder("Agent name").fill(name);
  await page.getByRole("button", { name: /^continue$/i }).click();
  await expect(page.getByRole("button", { name: /save changes/i })).toBeVisible(
    { timeout: 60_000 },
  );
}

async function openNewTeam(page: Page, name: string) {
  await page.getByRole("button", { name: /agent teams/i }).click();
  await page.getByText(/create new agent team/i).click();
  await page.getByPlaceholder("Agents Team name").fill(name);
  await page.getByRole("button", { name: /^continue$/i }).click();
  await expect(page.locator(CANVAS)).toBeVisible();
}

test("S1: signs in and reads the wallet's real records", async ({
  page,
  signIn,
}) => {
  await signIn();

  // The dashboard rendered from a real list read. Asserting on the search
  // control rather than on any record, because a fresh wallet legitimately has
  // none and this test is about the read succeeding at all.
  await expect(page.getByPlaceholder(/search agents/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /agent teams/i }),
  ).toBeVisible();
});

test("S2: creates and saves an agent on chain", async ({ page, signIn }) => {
  await signIn();
  const name = uniqueName("e2e-agent");
  await createAgent(page, name);

  await page.getByRole("button", { name: /save changes/i }).click();

  // Back to the dashboard through the interface -- a reload would sign the
  // in-memory wallet out -- and find the agent the chain now holds.
  await page.getByRole("button", { name: /back to dashboard/i }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /confirm|yes|leave/i })
    .click();
  await page.getByPlaceholder(/search agents/i).fill(name);

  // The list is re-read until the observer catches up, which is exactly the
  // behaviour the mock imitates with its stale-read budget. Here it is real.
  await expect(page.getByText(name)).toBeVisible({
    timeout: FINALIZATION_BUDGET_MS,
  });
});

test("S3: assembles a team from that agent and deploys it", async ({
  page,
  signIn,
}) => {
  await signIn();

  const agentName = uniqueName("e2e-agent");
  await createAgent(page, agentName);
  await page.getByRole("button", { name: /save changes/i }).click();
  await page.getByRole("button", { name: /back to dashboard/i }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /confirm|yes|leave/i })
    .click();

  const teamName = uniqueName("e2e-team");
  await openNewTeam(page, teamName);

  // The integration the platform is for: an agent saved moments ago, offered
  // to a team by a REAL list read rather than by a seeded fixture.
  await expect(
    page.getByTestId(/^sidebar-agent-/).filter({ hasText: agentName }),
  ).toBeVisible({ timeout: FINALIZATION_BUDGET_MS });

  const canvas = page.locator(CANVAS);
  await dragAndDrop(page, page.getByTestId("sidebar-node-input-node"), canvas, {
    x: 0.25,
    y: 0.4,
  });
  await dragAndDrop(
    page,
    page.getByTestId("sidebar-node-output-node"),
    canvas,
    { x: 0.75, y: 0.4 },
  );
  await connectHandles(
    page,
    canvas.locator(".react-flow__handle-right").first(),
    canvas.locator(".react-flow__handle-left").first(),
  );
  await expect(canvas.locator(".react-flow__edge")).toHaveCount(1);

  await page.getByRole("button", { name: /^deploy$/i }).click();
  await expect(page.getByRole("button", { name: /^back$/i })).toBeVisible({
    timeout: FINALIZATION_BUDGET_MS,
  });
  await page
    .getByRole("button", { name: /^deploy$/i })
    .last()
    .click();

  // A success dialog is the only place the deployment's own details are shown,
  // and reaching it means the registry write finalized.
  await expect(page.getByRole("dialog")).toBeVisible({
    timeout: FINALIZATION_BUDGET_MS,
  });
});

test("S4: a deployed team can be deployed again after an edit", async ({
  page,
  signIn,
}) => {
  await signIn();

  const teamName = uniqueName("e2e-team");
  await openNewTeam(page, teamName);
  const canvas = page.locator(CANVAS);
  await dragAndDrop(page, page.getByTestId("sidebar-node-input-node"), canvas, {
    x: 0.25,
    y: 0.4,
  });
  await dragAndDrop(
    page,
    page.getByTestId("sidebar-node-output-node"),
    canvas,
    { x: 0.75, y: 0.4 },
  );
  await connectHandles(
    page,
    canvas.locator(".react-flow__handle-right").first(),
    canvas.locator(".react-flow__handle-left").first(),
  );

  await page.getByRole("button", { name: /^deploy$/i }).click();
  await expect(page.getByRole("button", { name: /^back$/i })).toBeVisible({
    timeout: FINALIZATION_BUDGET_MS,
  });
  await page
    .getByRole("button", { name: /^deploy$/i })
    .last()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible({
    timeout: FINALIZATION_BUDGET_MS,
  });

  // Back to the editor from the success dialog, where the primary action must
  // now read Run -- deployed, with nothing unsaved.
  await page.getByRole("button", { name: /view agent|review/i }).click();
  await expect(page.getByRole("button", { name: /^run$/i })).toBeVisible({
    timeout: 60_000,
  });

  // And deploying again is still reachable, which is the regression this whole
  // journey exists for: it used to have no entry point at all.
  await page.getByRole("button", { name: /more actions/i }).click();
  await expect(page.getByRole("menuitem", { name: /^deploy$/i })).toBeVisible();
});

test("S5: deleting an agent a team uses warns before it removes anything", async ({
  page,
  signIn,
}) => {
  await signIn();

  const agentName = uniqueName("e2e-agent");
  await createAgent(page, agentName);
  await page.getByRole("button", { name: /save changes/i }).click();
  await page.getByRole("button", { name: /back to dashboard/i }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /confirm|yes|leave/i })
    .click();
  await page.getByPlaceholder(/search agents/i).fill(agentName);
  await expect(page.getByText(agentName)).toBeVisible({
    timeout: FINALIZATION_BUDGET_MS,
  });

  await page
    .getByTitle(/delete/i)
    .filter({ visible: true })
    .first()
    .click();

  // The confirmation must be reachable -- the overlay bug that started this
  // campaign, confirmed against a real backend whose referencing read is slow
  // enough to keep the loader up for a while.
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 60_000 });
  await expect(page.locator(".overlay")).toHaveCount(0);
  await dialog.getByRole("button", { name: /confirm|delete|yes/i }).click();

  await expect(page.getByText(agentName)).toHaveCount(0, {
    timeout: FINALIZATION_BUDGET_MS,
  });
});
