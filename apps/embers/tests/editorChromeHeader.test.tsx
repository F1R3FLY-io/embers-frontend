/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { Header } from "@/lib/components/Header";

/**
 * The editor's title bar, as something other than a mouse can use it.
 *
 * Leaving an editor and opening its settings are the only two controls on this
 * bar, and both were click-handling `div`s carrying nothing but an icon. That
 * has two consequences a sighted mouse user never meets: neither control can
 * be reached by keyboard, and neither announces anything -- an icon with no
 * text is not a name.
 *
 * Asserted through roles and accessible names rather than by class, because
 * the class was never the problem: the markup rendered perfectly and was
 * simply unusable without a pointer.
 */

function renderHeader() {
  const onBackClick = jest.fn();
  const onSettingsClick = jest.fn();
  render(
    <Header
      title="Research Desk"
      onBackClick={onBackClick}
      onSettingsClick={onSettingsClick}
    />,
  );
  return { onBackClick, onSettingsClick };
}

it("names both controls for a screen reader", () => {
  renderHeader();

  expect(
    screen.getByRole("button", { name: "publish.backToDashboard" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "agents.generalSettings" }),
  ).toBeInTheDocument();
});

it("leaves the editor when the back control is activated", async () => {
  const user = userEvent.setup();
  const { onBackClick } = renderHeader();

  await user.click(
    screen.getByRole("button", { name: "publish.backToDashboard" }),
  );

  expect(onBackClick).toHaveBeenCalledTimes(1);
});

it("opens settings when that control is activated", async () => {
  const user = userEvent.setup();
  const { onSettingsClick } = renderHeader();

  await user.click(
    screen.getByRole("button", { name: "agents.generalSettings" }),
  );

  expect(onSettingsClick).toHaveBeenCalledTimes(1);
});

it("reaches both controls by keyboard alone", async () => {
  const user = userEvent.setup();
  const { onBackClick, onSettingsClick } = renderHeader();

  // Tab order follows the document, so the back control comes first. A `div`
  // is not in the tab sequence at all, which is the state this guards against:
  // a keyboard user could not leave the editor.
  await user.tab();
  expect(
    screen.getByRole("button", { name: "publish.backToDashboard" }),
  ).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(onBackClick).toHaveBeenCalledTimes(1);

  await user.tab();
  expect(
    screen.getByRole("button", { name: "agents.generalSettings" }),
  ).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(onSettingsClick).toHaveBeenCalledTimes(1);
});

it("hides the decorative arrow glyph from assistive technology", () => {
  renderHeader();

  // The icon font's glyph carries no meaning of its own; the button's label
  // does. Left exposed, it announces as a stray character beside the name.
  const back = screen.getByRole("button", {
    name: "publish.backToDashboard",
  });
  expect(back.querySelector("i")).toHaveAttribute("aria-hidden");
});
