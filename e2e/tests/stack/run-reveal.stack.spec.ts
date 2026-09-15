import { expect, FINALIZATION_BUDGET_MS, test } from "../../support/stack";

test("reveals a completed run and keeps its response inside the viewport", async ({
  page,
  signIn,
}) => {
  test.setTimeout(FINALIZATION_BUDGET_MS + 30_000);
  const runId = process.env.EMBERS_E2E_REVEAL_RUN_ID;
  test.skip(
    !runId,
    "Set EMBERS_E2E_REVEAL_RUN_ID to a completed run owned by the configured wallet.",
  );
  await signIn();
  await page.goto(`/runs/${encodeURIComponent(runId!)}`);
  await page.getByRole("link", { name: "Sign in to view response" }).click();
  await page.getByRole("button", { name: /sign in with/i }).click();
  await page
    .getByLabel("Private key", { exact: true })
    .fill(process.env.EMBERS_E2E_STACK_KEY!);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page
    .getByRole("button", { exact: true, name: "Reveal full response" })
    .click();
  const response = page.getByRole("region", {
    exact: true,
    name: "Full response",
  });
  await expect(response).toBeVisible({ timeout: FINALIZATION_BUDGET_MS });
  await expect(
    response.getByRole("heading", {
      name: "Full response (visible only to you)",
    }),
  ).toBeInViewport();
  await response.getByText("Raw response", { exact: true }).click();
  const raw = page.getByTestId("reveal-result-json");
  expect((await raw.innerText()).length).toBeGreaterThan(2);
  const box = await response.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(
    page.viewportSize()!.width + 1,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});
