/* eslint-disable no-await-in-loop -- Each step depends on the previous UI action and finalized write. */
import type { Locator, Page } from "@playwright/test";

import { expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { dragAndDrop } from "./dnd";

export const redBlueDir = fileURLToPath(
  new URL("../../demo/red-blue/", import.meta.url),
);
export const redBlueGraph = JSON.parse(
  readFileSync(`${redBlueDir}graph.json`, "utf8"),
) as {
  agents: string[];
  edges: [string, string][];
};
export const deterministic = JSON.parse(
  readFileSync(`${redBlueDir}fixtures/deterministic.json`, "utf8"),
) as {
  agents: Record<string, string>;
  cases: { brief: string; expected: string; name: string }[];
};

export async function buildRedBlueInBrowser(
  page: Page,
  codes: Record<string, string>,
  teamName: string,
) {
  const ids: Partial<Record<string, string>> = {};
  for (const name of redBlueGraph.agents) {
    await page.getByText(/create new agent$/i).click();
    await page.getByPlaceholder("Agent name", { exact: true }).fill(name);
    await page.getByRole("button", { name: /^continue$/i }).click();
    const editor = page.locator('.cm-content[contenteditable="true"]').first();
    await expect(editor).toBeVisible({ timeout: 60_000 });
    await expect(editor).toContainText(`// ${name} agent.`, {
      timeout: 60_000,
    });
    await editor.click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.insertText(codes[name]);
    await page.keyboard.press("ArrowLeft");
    const saved = page.waitForResponse(
      (r) =>
        r.url().includes("/ai-agents/create/prepare") &&
        r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /save changes/i }).click();
    const response = await saved;
    expect(response.ok()).toBeTruthy();
    expect(
      (response.request().postDataJSON() as { code: string }).code.trim(),
    ).toBe(codes[name].trim());
    const record = (await response.json()) as { response: { id: string } };
    ids[name] = record.response.id;
    await page.getByRole("button", { name: /back to dashboard/i }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /confirm|yes|leave/i })
      .click();
    await expect(page.getByPlaceholder(/search agents/i)).toBeVisible();
  }
  await page.getByRole("button", { name: /agent teams/i }).click();
  await page.getByText(/create new agent team/i).click();
  await page.getByPlaceholder("Agents Team name").fill(teamName);
  await page.getByRole("button", { name: /^continue$/i }).click();
  const canvas = page.locator(".react-flow");
  await expect(canvas).toBeVisible();
  const positions: Record<string, { x: number; y: number }> = {
    BluePlanner: { x: 0.34, y: 0.45 },
    BlueResponder: { x: 0.67, y: 0.45 },
    DecisionWriter: { x: 0.81, y: 0.45 },
    EmergencyReviewPolicy: { x: 0.19, y: 0.7 },
    Input: { x: 0.04, y: 0.45 },
    Output: { x: 0.96, y: 0.45 },
    RedEvidence: { x: 0.5, y: 0.45 },
    RedLogic: { x: 0.5, y: 0.2 },
    RedOperations: { x: 0.5, y: 0.7 },
    ReviewCapacity: { x: 0.19, y: 0.2 },
  };
  const nodes: Record<string, Locator> = {};
  for (const name of ["Input", ...redBlueGraph.agents, "Output"]) {
    const source = page.getByTestId(
      ids[name] === undefined
        ? `sidebar-node-${name.toLowerCase()}-node`
        : `sidebar-agent-${ids[name]}`,
    );
    await source.scrollIntoViewIfNeeded();
    await dragAndDrop(page, source, canvas, positions[name]);
    if (ids[name] !== undefined) {
      const configure = page.getByRole("dialog", { name: "Configure Agent" });
      await expect(configure.getByRole("textbox")).toHaveValue("simple-v1");
      await configure.getByRole("button", { name: /^save$/i }).click();
    }
    await expect(canvas.locator(".react-flow__node")).toHaveCount(
      Object.keys(nodes).length + 1,
    );
    nodes[name] = canvas
      .locator(".react-flow__node")
      .filter({ has: page.getByText(name, { exact: true }) });
  }
  await expect(canvas.locator(".react-flow__node")).toHaveCount(10);
  const box = (await canvas.boundingBox())!;
  // Move Input last: later palette drops can overlap its initial position.
  for (const name of [...redBlueGraph.agents, "Output", "Input"]) {
    const label = (await nodes[name]
      .getByText(name, { exact: true })
      .boundingBox())!;
    await page.mouse.move(
      label.x + label.width / 2,
      label.y + label.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      box.x + box.width * positions[name].x,
      box.y + box.height * positions[name].y,
      { steps: 12 },
    );
    await page.mouse.up();
  }
  for (const [index, [from, to]] of redBlueGraph.edges.entries()) {
    const sourceHandle = nodes[from].locator(".react-flow__handle-right");
    const targetHandle = nodes[to].locator(".react-flow__handle-left");
    await sourceHandle.click();
    await targetHandle.click();
    await expect(canvas.locator(".react-flow__edge")).toHaveCount(index + 1);
  }
  await page.mouse.click(box.x + 5, box.y + 5);
  const agentBoxes = await Promise.all(
    redBlueGraph.agents.map(async (name) => nodes[name].boundingBox()),
  );
  const left = Math.min(...agentBoxes.map((node) => node!.x)) - 8;
  const top = Math.min(...agentBoxes.map((node) => node!.y)) - 8;
  const right =
    Math.max(...agentBoxes.map((node) => node!.x + node!.width)) + 8;
  const bottom =
    Math.max(...agentBoxes.map((node) => node!.y + node!.height)) + 8;
  await page.keyboard.down("Shift");
  await page.mouse.move(left, top);
  await page.mouse.down();
  await page.mouse.move(right, bottom, { steps: 20 });
  await page.mouse.up();
  await page.keyboard.up("Shift");
  await expect(canvas.locator(".react-flow__node.selected")).toHaveCount(8);
  await canvas
    .locator(".react-flow__nodesselection-rect")
    .click({ button: "right", position: { x: 3, y: 3 } });
  await page.getByText("Add to deploy container", { exact: true }).click();
  await expect(
    canvas.locator(".react-flow__node-deploy-container"),
  ).toHaveCount(1);
  await expect(canvas.locator(".react-flow__edge")).toHaveCount(25);
  const preparedDeployment = page.waitForResponse(
    (response) =>
      response.url().includes("/ai-agents-teams/deploy/prepare") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /^deploy$/i }).click();
  await expect(page.getByRole("button", { name: /^back$/i })).toBeVisible({
    timeout: 150_000,
  });
  await page
    .getByRole("button", { name: /^deploy$/i })
    .last()
    .click();
  const prepared = await preparedDeployment;
  expect(prepared.ok()).toBeTruthy();
  const plan = (await prepared.json()) as {
    response: { containers: { id: string; uri: string }[] };
  };
  expect(plan.response.containers).toHaveLength(1);
  expect(plan.response.containers[0].uri).toMatch(/^rho:id:/);
  const success = page.getByRole("dialog", { name: "Success deploy" });
  await expect(success).toBeVisible({ timeout: 150_000 });
  await success.getByRole("button", { name: /view agent/i }).click();
  await expect(page.getByRole("button", { name: /^run$/i })).toBeVisible();
}

export async function runRedBlueInBrowser(
  page: Page,
  brief: string,
): Promise<unknown> {
  await page.getByRole("button", { name: /^run$/i }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox").fill(brief);
  const result = page.waitForResponse(
    (r) =>
      r.url().includes("/ai-agents-teams/run/send") &&
      r.request().method() === "POST",
    { timeout: 600_000 },
  );
  await dialog.getByRole("button", { name: /^run$/i }).click();
  const response = await result;
  expect(response.ok()).toBeTruthy();
  return response.json();
}
