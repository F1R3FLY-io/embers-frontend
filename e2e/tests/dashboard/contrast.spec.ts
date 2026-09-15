import { expect, test } from "../../support/fixtures";

// Every control's label has to be readable against the surface it sits on.
//
// A secondary button drew its label in exactly its own background colour, so
// it rendered as a blank rectangle -- including the Cancel button on every
// confirmation dialog, where the user saw "Confirm" beside an empty shape.
// The cause was a token defined only in the dark theme and inherited unchanged
// by the light one, where it collided with the background token.
//
// jsdom cannot see this: it resolves no custom properties and computes no
// cascade, so the two colours are indistinguishable there. It needs a browser.

/** Parses "rgb(r, g, b)" into components. */
function channels(colour: string): [number, number, number] {
  const parts = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(colour);
  if (parts === null) {
    throw new Error(`unrecognised colour: ${colour}`);
  }
  return [Number(parts[1]), Number(parts[2]), Number(parts[3])];
}

/** Relative luminance, per WCAG's definition. */
function luminance(colour: string): number {
  const [r, g, b] = channels(colour).map((value) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test("gives every labelled button a readable label", async ({
  backend,
  page,
  signIn,
}) => {
  backend.store.addAgent({ id: "a1", name: "Researcher" });
  await signIn();
  // Routes are lazy-loaded behind a null Suspense fallback, so the URL changes
  // before the page has any content. Measuring immediately after sign-in finds
  // an almost empty document.
  await expect(page.getByText("Researcher")).toBeVisible();

  const measured = await page.evaluate(() =>
    Array.from(document.querySelectorAll("button"))
      .filter((el) => el.textContent.trim() !== "")
      .map((el) => {
        const span = el.querySelector("span");
        return {
          background: getComputedStyle(el).backgroundColor,
          colour: getComputedStyle(span ?? el).color,
          label: el.textContent.trim(),
        };
      }),
  );

  expect(measured.length).toBeGreaterThan(3);

  const unreadable = measured
    // Only buttons painting their own background can be judged here; a
    // transparent one inherits whatever is behind it.
    .filter(({ background }) => !background.startsWith("rgba(0, 0, 0, 0"))
    .filter(({ background, colour }) => contrastRatio(colour, background) < 3)
    .map(({ label }) => label);

  // Named rather than counted, so a failure says which control went blank.
  expect(unreadable).toEqual([]);
});

test("keeps the cancel button on a confirmation readable", async ({
  backend,
  page,
  signIn,
}) => {
  backend.store.addAgent({ id: "a1", name: "Researcher" });
  await signIn();

  await page
    .getByTitle(/delete/i)
    .filter({ visible: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Located rather than queried from the document: the dialog is portalled,
  // and a locator waits for it where a raw DOM read races the render.
  const cancel = dialog.getByRole("button", { name: /cancel/i });
  await expect(cancel).toBeVisible();

  const colours = await cancel.evaluate((el) => {
    const span = el.querySelector("span");
    return {
      background: getComputedStyle(el).backgroundColor,
      colour: getComputedStyle(span ?? el).color,
    };
  });

  // The specific control this bug hid, on the dialog where hiding it matters
  // most: a delete confirmation with no visible way to decline.
  expect(contrastRatio(colours.colour, colours.background)).toBeGreaterThan(3);
});
