/* eslint-disable no-await-in-loop -- Browser interactions intentionally execute in order. */
import { expect, FINALIZATION_BUDGET_MS, test } from "../../support/stack";

test("reveals all six saved agent outputs without losing them offscreen", async ({
  page,
  signIn,
}) => {
  test.setTimeout(FINALIZATION_BUDGET_MS + 60_000);
  const runId = process.env.EMBERS_E2E_REVEAL_RUN_ID;
  test.skip(
    !runId,
    "Set EMBERS_E2E_REVEAL_RUN_ID to the saved six-agent red/blue run.",
  );
  await signIn();
  await page.goto(`/runs/${encodeURIComponent(runId!)}`);
  await page.getByRole("link", { name: "Sign in to view response" }).click();
  await page.getByRole("button", { name: /sign in with/i }).click();
  await page
    .getByLabel("Private key", { exact: true })
    .fill(process.env.EMBERS_E2E_STACK_KEY!);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.getByRole("button", { name: "Unlock agent history" }).click();
  const activity = page.getByRole("region", {
    exact: true,
    name: "Agent activity",
  });
  for (const agent of [
    "BluePlanner",
    "RedLogic",
    "RedOperations",
    "RedEvidence",
    "BlueResponder",
    "DecisionWriter",
  ]) {
    const row = activity
      .locator("summary")
      .filter({ hasText: new RegExp(`^${agent} — completed`) });
    await expect(row).toBeVisible({ timeout: FINALIZATION_BUDGET_MS });
    await row.click();
    const output = activity.getByRole("region", {
      exact: true,
      name: `${agent} output`,
    });
    await expect(output).toBeVisible();
    expect((await output.innerText()).length).toBeGreaterThan(100);
  }
  for (const width of [1280, 390]) {
    await page.setViewportSize({ height: 800, width });
    await activity
      .getByRole("heading", { exact: true, name: "DecisionWriter output" })
      .scrollIntoViewIfNeeded();
    await expect(
      activity.getByRole("heading", {
        exact: true,
        name: "DecisionWriter output",
      }),
    ).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
});
