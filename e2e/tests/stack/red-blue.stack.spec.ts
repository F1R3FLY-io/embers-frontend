import {
  Amount,
  EmbersApiSdk,
  PrivateKey,
} from "@f1r3fly-io/embers-client-sdk";

import {
  buildRedBlueInBrowser,
  deterministic,
  runRedBlueInBrowser,
} from "../../support/red-blue";
import { expect, test, uniqueName } from "../../support/stack";

test.use({ viewport: { height: 1500, width: 3400 } });
test("creates eight red/blue agents, wraps them in a deploy container, deploys and runs the team", async ({
  apiUrl,
  page,
  signIn,
}) => {
  test.setTimeout(15 * 60_000);
  page.setDefaultTimeout(20_000);
  await signIn();
  const key = PrivateKey.new();
  const funder = new EmbersApiSdk({
    basePath: apiUrl,
    privateKey: PrivateKey.tryFromHex(process.env.EMBERS_E2E_STACK_KEY!),
  });
  try {
    const transfer = await funder.wallets.transfer(
      key.getPublicKey().getAddress(),
      Amount.tryFrom(100_000_000n),
      "Red/blue browser integration test",
    );
    await transfer.waitForFinalization;
  } finally {
    funder.events.close();
  }
  await page.goto("/login");
  await page.getByRole("button", { name: /sign in with/i }).click();
  await page.getByRole("textbox").first().fill(key.toHex());
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL("**/dashboard");
  await buildRedBlueInBrowser(
    page,
    deterministic.agents,
    uniqueName("RedBlueDecisionReview-test"),
  );
  const scenario = deterministic.cases.find((c) => c.name === "acceptable")!;
  const result = await runRedBlueInBrowser(page, scenario.brief);
  expect(result).toEqual(scenario.expected);
  await expect(page.getByText(/Recommendation\|/).first()).toBeVisible();
});
