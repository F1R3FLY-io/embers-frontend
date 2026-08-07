import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

import { dragAndDrop } from "../support/dnd";
import { expect, test } from "../support/fixtures";

/**
 * Screenshots and recordings for the usage documentation.
 *
 * Run against the mock backend rather than the real stack, deliberately: the
 * fixture names, timestamps, and record counts are then identical on every
 * run, so a regenerated image differs only where the interface actually
 * changed. A capture against a live chain would produce a new diff every time
 * from timestamps alone, and reviewers would stop reading them.
 *
 * Not part of the test run. These assert almost nothing; their output is the
 * point, and a failure here should mean "the journey no longer works", which
 * the real suites already say more precisely.
 */

const MEDIA = "../docs/usage/media";

/**
 * Where recordings land before conversion.
 *
 * Playwright names its own video files after an internal hash of the test
 * path, which is neither stable nor meaningful. Each recording is therefore
 * re-saved under a name derived from the journey's title, so the conversion
 * step downstream can produce `docs/usage/media/<journey>.gif` without knowing
 * anything about Playwright's directory layout.
 */
const VIDEO_STAGING = "video";

/** "Assembling a team" to "assembling-a-team". */
function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

test.use({
  video: { mode: "on", size: { height: 800, width: 1280 } },
  viewport: { height: 800, width: 1280 },
});

test.beforeEach(async ({ page }) => {
  // Entrance animations make consecutive frames differ for reasons that have
  // nothing to do with the interface, so they are stilled for capture.
  await page.addInitScript(() => {
    const style = document.createElement("style");
    style.textContent =
      "*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; }";
    document.addEventListener("DOMContentLoaded", () =>
      document.head.append(style),
    );
  });
});

test.afterEach(async ({ page }, testInfo) => {
  const video = page.video();
  if (video === null) {
    return;
  }
  // The recording is only complete once the page is closed, so this closes it
  // rather than leaving the file truncated at whatever frame the run ended on.
  await page.close();

  const destination = join(VIDEO_STAGING, `${slug(testInfo.title)}.webm`);
  await mkdir(dirname(destination), { recursive: true });
  await video.saveAs(destination);
});

test("signing in", async ({ backend, page }) => {
  void backend;
  await page.goto("/login");
  await page.screenshot({
    animations: "disabled",
    caret: "hide",
    path: `${MEDIA}/getting-started/01-welcome.png`,
  });

  await page.getByRole("button", { name: /sign in with/i }).click();
  await page.screenshot({
    animations: "disabled",
    caret: "hide",
    path: `${MEDIA}/getting-started/02-enter-key.png`,
  });

  await page
    .getByRole("textbox")
    .first()
    .fill("0b4e1234567890abcdef0b4e1234567890abcdef0b4e1234567890abcdef0b4e");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL("**/dashboard");
  await page.screenshot({
    animations: "disabled",
    caret: "hide",
    path: `${MEDIA}/getting-started/03-dashboard.png`,
  });
});

test("browsing agents and teams", async ({ backend, page, signIn }) => {
  backend.store.addAgent({ id: "a1", name: "Researcher" });
  backend.store.addAgent({ id: "a2", name: "Critic" });
  backend.store.addAgent({ id: "a3", name: "Archivist" });
  backend.store.addTeam({
    agentIds: ["a1", "a2", "a3"],
    id: "t1",
    name: "Research Desk",
  });
  await signIn();

  await expect(page.getByText("Researcher")).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    caret: "hide",
    path: `${MEDIA}/dashboard/01-agents.png`,
  });

  await page.getByPlaceholder(/search agents/i).fill("critic");
  await page.screenshot({
    animations: "disabled",
    caret: "hide",
    path: `${MEDIA}/dashboard/02-search.png`,
  });
  await page.getByPlaceholder(/search agents/i).fill("");

  await page.getByRole("button", { name: /agent teams/i }).click();
  await expect(page.getByText("Research Desk")).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    caret: "hide",
    path: `${MEDIA}/dashboard/03-teams.png`,
  });
});

test("assembling a team", async ({ backend, page, signIn }) => {
  backend.store.addAgent({ id: "a1", name: "Researcher" });
  backend.store.addAgent({ id: "a2", name: "Critic" });
  await signIn();

  await page.getByRole("button", { name: /agent teams/i }).click();
  await page.getByText(/create new agent team/i).click();
  await page.screenshot({
    animations: "disabled",
    caret: "hide",
    path: `${MEDIA}/teams/01-name-the-team.png`,
  });

  await page.getByPlaceholder("Agents Team name").fill("Research Desk");
  await page.getByRole("button", { name: /^continue$/i }).click();
  const canvas = page.locator(".react-flow");
  await expect(canvas).toBeVisible();
  // The palette, showing that agents saved a moment ago are available to a
  // team straight away.
  await page.screenshot({
    animations: "disabled",
    caret: "hide",
    path: `${MEDIA}/teams/02-empty-canvas.png`,
  });

  await dragAndDrop(page, page.getByTestId("sidebar-agent-a1"), canvas, {
    x: 0.35,
    y: 0.4,
  });
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    caret: "hide",
    path: `${MEDIA}/teams/03-configure-node.png`,
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /^save$/i })
    .click();

  await dragAndDrop(page, page.getByTestId("sidebar-agent-a2"), canvas, {
    x: 0.72,
    y: 0.4,
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /^save$/i })
    .click();

  await expect(canvas.getByText("Researcher", { exact: true })).toBeVisible();
  await expect(canvas.getByText("Critic", { exact: true })).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    caret: "hide",
    path: `${MEDIA}/teams/04-two-agents.png`,
  });

  await page.getByRole("button", { name: /save as draft/i }).click();
  await expect
    .poll(() => backend.store.teams.length, { timeout: 20_000 })
    .toBe(1);
});

test("deleting an agent a team depends on", async ({
  backend,
  page,
  signIn,
}) => {
  backend.store.addAgent({ id: "a1", name: "Researcher" });
  backend.store.addTeam({
    agentIds: ["a1"],
    id: "t1",
    name: "Research Desk",
  });
  await signIn();

  await expect(page.getByText("Researcher")).toBeVisible();
  await page.screenshot({
    animations: "disabled",
    caret: "hide",
    path: `${MEDIA}/agents/01-before-delete.png`,
  });

  await page
    .getByTitle(/delete/i)
    .filter({ visible: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // The warning that names the team a deletion would break: the single most
  // useful thing to show a reader about this flow.
  await page.screenshot({
    animations: "disabled",
    caret: "hide",
    path: `${MEDIA}/agents/02-cascade-warning.png`,
  });

  await dialog.getByRole("button", { name: /confirm|delete|yes/i }).click();
  await expect(page.getByText("Researcher")).toHaveCount(0, {
    timeout: 20_000,
  });
  await page.screenshot({
    animations: "disabled",
    caret: "hide",
    path: `${MEDIA}/agents/03-after-delete.png`,
  });
});
