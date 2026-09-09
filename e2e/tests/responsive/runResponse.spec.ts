import { expect, test, TEST_KEY_HEX } from "../../support/fixtures";

const prose =
  "This is a long engineering decision with explicit constraints. ".repeat(80);
const answer = `# Recommendation\n\n${prose}\n\n## Review findings\n\n- First finding\n- Second finding\n\n| Risk | Mitigation |\n| --- | --- |\n| Delay | Review rotation |\n\n\`\`\`text\n${"x".repeat(2000)}\n\`\`\`\n\n${"longidentifier".repeat(150)}\n\n## Rollout checklist\n\n${prose}\n\nFinal paragraph: the full answer is reachable.`;

for (const theme of ["light", "dark"]) {
  test(`long revealed response stays reachable in ${theme} theme`, async ({
    backend,
    page,
  }, testInfo) => {
    backend.store.runs.set("run-layout", {
      createdAt: Date.now(),
      events: Array.from({ length: 80 }, (_, sequence) => ({
        event_type: "nodeEntered",
        sequence,
      })),
      id: "run-layout",
      output: JSON.stringify(answer),
      revision: 7,
      script: [],
      status: "completed",
      teamUri: "rho:id:hjkekxordj8i6aasfqdyzr3s67ep3dnsbf7q96wft3rn6hy5x5xb9i",
      waitIds: [],
    });
    await page.addInitScript(
      (value) => localStorage.setItem("theme", value),
      theme,
    );
    await page.goto("/runs/run-layout");
    await page.getByRole("link", { name: "Sign in to view response" }).focus();
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: /sign in with/i }).click();
    await page.getByRole("textbox").first().fill(TEST_KEY_HEX);
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await page
      .getByRole("button", { exact: true, name: "Reveal full response" })
      .click();
    const response = page.getByTestId("formatted-response");
    await expect(
      response.getByRole("heading", { name: "Recommendation" }),
    ).toBeVisible();
    const final = response.getByText(
      "Final paragraph: the full answer is reachable.",
    );
    await final.scrollIntoViewIfNeeded();
    await expect(final).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    const box = await response.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(
      page.viewportSize()!.width + 1,
    );
    if (testInfo.project.name === "mock-desktop") {
      await page.setViewportSize({ height: 500, width: 1280 });
      await page.evaluate(() => {
        document.documentElement.style.zoom = "2";
      });
      await final.scrollIntoViewIfNeeded();
      await expect(final).toBeInViewport();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.evaluate(() => {
        document.documentElement.style.zoom = "";
      });
      await page.setViewportSize({ height: 800, width: 1280 });
    }
    await page.getByText("Raw response", { exact: true }).click();
    await expect(page.getByTestId("reveal-result-json")).toHaveText(
      JSON.stringify(answer, null, 2),
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.getByText("Execution details", { exact: true }).click();
    await expect(
      page.getByText("Event history (81)", { exact: true }),
    ).toBeVisible();
    await page.getByRole("heading", { name: "Your response is ready" }).scrollIntoViewIfNeeded();
    await page.screenshot({
      fullPage: false,
      path: testInfo.outputPath(`run-${theme}.png`),
    });
  });
}

test("reveal failure stays on page and retry renders structured output", async ({ backend, page }) => {
  backend.store.runs.set("run-retry", {
    createdAt: Date.now(), events: [], id: "run-retry",
    output: JSON.stringify({ answer: "## Decision\n\nA useful answer after retry.", approved: false }),
    revision: 1, script: [], status: "completed",
    teamUri: "rho:id:hjkekxordj8i6aasfqdyzr3s67ep3dnsbf7q96wft3rn6hy5x5xb9i", waitIds: [],
  });
  let fail = true;
  await page.route("**/runs/run-retry/output/send", async (route) => {
    if (fail) {
      fail = false;
      await route.fulfill({ body: JSON.stringify({ description: "Unauthorized wallet" }), contentType: "application/json", status: 403 });
    } else {await route.continue();}
  });
  await page.goto("/runs/run-retry");
  await page.getByRole("link", { name: "Sign in to view response" }).focus();
    await page.keyboard.press("Enter");
  await page.getByRole("button", { name: /sign in with/i }).click();
  await page.getByRole("textbox").first().fill(TEST_KEY_HEX);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.getByRole("button", { exact: true, name: "Reveal full response" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByTestId("formatted-response")).toHaveCount(0);
  await page.getByRole("button", { exact: true, name: "Reveal full response" }).click();
  await expect(page.getByRole("heading", { exact: true, name: "Decision" })).toBeVisible();
  await page.getByText("Supporting data", { exact: true }).click();
  await expect(page.locator("details[open] > pre").filter({ hasText: '"approved": false' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: "Sign in to view response" })).toBeVisible();
  await expect(page.getByTestId("formatted-response")).toHaveCount(0);
});

test("an unavailable run can be retried without leaving the page", async ({ backend, page }) => {
  await page.goto("/runs/run-later");
  await expect(page.getByRole("heading", { name: "Run unavailable" })).toBeVisible();
  backend.store.runs.set("run-later", {
    createdAt: Date.now(), events: [], id: "run-later", output: JSON.stringify("Recovered response"),
    revision: 1, script: [], status: "completed",
    teamUri: "rho:id:hjkekxordj8i6aasfqdyzr3s67ep3dnsbf7q96wft3rn6hy5x5xb9i", waitIds: [],
  });
  await page.getByRole("button", { name: "Retry loading run" }).click();
  await expect(page.getByRole("heading", { name: "Your response is ready" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in to view response" })).toBeVisible();
});
