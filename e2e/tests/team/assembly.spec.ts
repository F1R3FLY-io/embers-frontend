import type { Page } from "@playwright/test";

import { dragAndDrop } from "../../support/dnd";
import { expect, test } from "../../support/fixtures";

/**
 * Assembling a team from agents, in a real browser.
 *
 * This is the integration the platform is FOR, and the one that has broken
 * before: agents could be created but not added to a team. Nothing in a unit
 * test reaches it, because the failure lives in the seam between three
 * separate things -- the agent list query, the sidebar that renders it, and
 * the canvas that receives an HTML5 drag carrying custom MIME data.
 */

/**
 * The element that receives the drop.
 *
 * `.react-flow` is the library's own root class, and the drop handler is on
 * that element rather than on the wrapper around it -- a drop dispatched on an
 * ancestor would never reach it, since events travel upward.
 */
const CANVAS = ".react-flow";

async function openNewTeam(page: Page, name: string) {
  await page.getByRole("button", { name: /agent teams/i }).click();
  await page.getByText(/create new agent team/i).click();
  await page.getByPlaceholder("Agents Team name").fill(name);
  await page.getByRole("button", { name: /^continue$/i }).click();
  await expect(page.locator(CANVAS)).toBeVisible();
}

/** Drops a palette agent using its default protocol without a dialog. */
async function placeAgent(page: Page, agentId: string) {
  await dragAndDrop(
    page,
    page.getByTestId(`sidebar-agent-${agentId}`),
    page.locator(CANVAS),
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

test("offers every saved agent in the team palette", async ({
  backend,
  page,
  signIn,
}) => {
  backend.store.addAgent({ id: "a1", name: "Researcher" });
  // Deliberately never deployed. A team splices an agent's code in, so the
  // agent's own deploy is irrelevant here -- filtering on it would hide the
  // agent the user just wrote, which is precisely how "I made an agent and it
  // is not in the list" happens.
  backend.store.addAgent({ id: "a2", name: "Archivist" });
  await signIn();
  await openNewTeam(page, "Research Desk");

  await expect(page.getByTestId("sidebar-agent-a1")).toContainText(
    "Researcher",
  );
  await expect(page.getByTestId("sidebar-agent-a2")).toContainText("Archivist");
});

test("adds an agent to the canvas by dragging it from the palette", async ({
  backend,
  page,
  signIn,
}) => {
  backend.store.addAgent({ id: "a1", name: "Researcher" });
  await signIn();
  await openNewTeam(page, "Research Desk");

  await dragAndDrop(
    page,
    page.getByTestId("sidebar-agent-a1"),
    page.locator(CANVAS),
  );

  await expect(page.getByRole("dialog")).toHaveCount(0);
  const node = page.locator(".react-flow__node-agent");
  const position = await node.getAttribute("style");
  const gear = node.getByRole("button", { name: "Configure Researcher" });
  await gear.click();
  const dialog = page.getByRole("dialog", { name: "Edit node" });
  await expect(dialog).toBeVisible();
  const protocol = dialog.getByRole("combobox", { name: "Protocol" });
  await expect(protocol).toContainText("simple-v1");
  await protocol.click();
  await dialog
    .getByText("Workflow invocation and result (structured-v1)", {
      exact: true,
    })
    .click();
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(node).toHaveAttribute("style", position!);
  await gear.focus();
  await page.keyboard.press("Enter");
  await expect(protocol).toContainText("structured-v1");
  await protocol.click();
  await dialog
    .getByText("Direct input and result (simple-v1)", { exact: true })
    .click();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await gear.click();
  await expect(protocol).toContainText("structured-v1");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: /save as draft/i }).click();
  await expect.poll(() => backend.store.teams.length).toBe(1);
  const definition = backend.store.teams[0].definition as {
    nodes: Record<string, { activity?: { protocol?: string } }>;
  };
  expect(
    Object.values(definition.nodes).some(
      (member) => member.activity?.protocol === "structured-v1",
    ),
  ).toBe(true);

  // The node carries the agent's own name, which is how the author recognises
  // it on a canvas of otherwise identical shapes.
  await expect(
    page.locator(CANVAS).getByText("Researcher", { exact: true }),
  ).toBeVisible();
});

test("refuses a node it cannot identify rather than creating a broken one", async ({
  backend,
  page,
  signIn,
}) => {
  backend.store.addAgent({ id: "a1", name: "Researcher" });
  await signIn();
  await openNewTeam(page, "Research Desk");

  // A drag that carries the agent KIND but no agent identity. It is what a
  // malformed palette entry would produce, and accepting it would put a node
  // on the canvas that compiles to an invalid graph -- discovered at deploy
  // time, long after the mistake.
  await page.evaluate((selector) => {
    const canvas = document.querySelector(selector);
    if (canvas === null) {
      throw new Error("no canvas");
    }
    const dataTransfer = new DataTransfer();
    dataTransfer.setData("application/reactflow", "agent");
    dataTransfer.setData("application/reactflow-data", "{}");
    const options = { bubbles: true, cancelable: true, dataTransfer };
    canvas.dispatchEvent(new DragEvent("dragover", options));
    canvas.dispatchEvent(new DragEvent("drop", options));
  }, CANVAS);

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.locator(CANVAS).getByText("Researcher", { exact: true }),
  ).toHaveCount(0);
});

test("saves an assembled team and records which agents it uses", async ({
  backend,
  page,
  signIn,
}) => {
  backend.store.addAgent({ id: "a1", name: "Researcher" });
  await signIn();
  await openNewTeam(page, "Research Desk");
  await placeAgent(page, "a1");

  await page.getByRole("button", { name: /save as draft/i }).click();

  // On the server, not merely on the screen. The editor holds the team in
  // memory until it is saved, so a save that never left the browser would look
  // identical here.
  await expect
    .poll(() => backend.store.teams.length, { timeout: 20_000 })
    .toBe(1);
  expect(backend.store.teams[0].name).toBe("Research Desk");

  // And the reference is recorded, which is what makes the delete-cascade
  // warning able to tell the truth about a team the user just built.
  expect(backend.store.teams[0].agentIds).toEqual(["a1"]);
});

test("warns that deleting an agent would break a team the user just assembled", async ({
  backend,
  page,
  signIn,
}) => {
  backend.store.addAgent({ id: "a1", name: "Researcher" });
  await signIn();
  await openNewTeam(page, "Research Desk");
  await placeAgent(page, "a1");
  await page.getByRole("button", { name: /save as draft/i }).click();
  await expect
    .poll(() => backend.store.teams.length, { timeout: 20_000 })
    .toBe(1);

  // Back through the interface rather than by navigating the browser: the
  // wallet lives in memory, so a page load would sign the user out and land on
  // the login screen instead of the dashboard.
  await page.getByRole("button", { name: /back to dashboard/i }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /confirm|yes|leave/i })
    .click();
  await expect(page.getByPlaceholder(/search agents/i)).toBeVisible();

  // The end-to-end version of the cascade warning: nothing seeded the
  // reference, the application recorded it by saving a graph it built. That is
  // the case the original bug got wrong -- the warning was right about
  // fixtures and silent about real work.
  await page
    .getByTitle(/delete/i)
    .filter({ visible: true })
    .first()
    .click();

  await expect(page.getByRole("dialog")).toContainText(/Research Desk/);
});
