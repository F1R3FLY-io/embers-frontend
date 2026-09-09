import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildRedBlueInBrowser,
  redBlueDir,
  redBlueGraph,
  runRedBlueInBrowser,
} from "../support/red-blue";

const runDir =
  process.env.EMBERS_STACK_RUN_DIR ??
  resolve(redBlueDir, "../../../embers-local-stack/run/profiles/research-desk");
const address = readFileSync(`${runDir}/wallet/address.txt`, "utf8").trim();
const key = (
  JSON.parse(readFileSync(`${runDir}/wallet/${address}.json`, "utf8")) as {
    value: string;
  }
).value;
const codes = Object.fromEntries(
  redBlueGraph.agents.map((name) => [
    name,
    readFileSync(`${redBlueDir}agents/${name}.rho`, "utf8"),
  ]),
);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    baseURL: "http://localhost:5173",
    viewport: { height: 1500, width: 3400 },
  });
  await page.addInitScript("globalThis.__name = (target) => target;");
  page.setDefaultTimeout(20_000);
  await page.goto("/login");
  await page.getByRole("button", { name: /sign in with/i }).click();
  await page.getByRole("textbox").first().fill(key);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL("**/dashboard");
  await buildRedBlueInBrowser(page, codes, "RedBlueDecisionReview-live");
  await page.screenshot({ path: `${runDir}/red-blue-live-canvas.png` });
  const answer = await runRedBlueInBrowser(
    page,
    readFileSync(`${redBlueDir}brief.txt`, "utf8"),
  );
  if (
    typeof answer !== "string" ||
    ![
      "Recommendation",
      "Changes after review",
      "Remaining risks",
      "Rollout checklist",
    ].every((heading) => answer.toLowerCase().includes(heading.toLowerCase()))
  ) {
    throw new Error(
      `Live rehearsal did not return all four brief sections: ${JSON.stringify(answer)}`,
    );
  }
  writeFileSync(`${runDir}/red-blue-live-answer.txt`, `${answer  }\n`);
  process.stdout.write(`${answer  }\n`);
  process.stdout.write("PASS: created, connected, deployed and ran six live agents through the UI\n");
} finally {
  await browser.close();
}
