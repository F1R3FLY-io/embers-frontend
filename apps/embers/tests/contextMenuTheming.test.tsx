/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";

import { ContextMenu } from "@/lib/components/ContextMenu";

const { readFileSync } = jest.requireActual<{
  readFileSync: (path: string, encoding: "utf8") => string;
}>("fs");

// The regression this suite pins: @szhsin/react-menu applies ControlledMenu's
// `className` to the menu CONTAINER, a wrapper that stays mounted while the
// menu is closed -- and the Graph header renders one permanently beside the
// Save as Draft / Deploy buttons. Any box styling placed directly on that
// class painted a visible gray pill over those buttons, while the open menu
// itself kept the stock cream skin under app-token (near-white) item text --
// a menu that looked empty. The theme class must therefore carry no direct
// declarations; every visual rule must live under the nested .szh-menu,
// which only exists while the menu is open.

const items = [
  { content: "Deploy", onClick: jest.fn(), type: "text" as const },
  { content: "Publish", onClick: jest.fn(), type: "text" as const },
];

it("renders nothing visible while closed: the themed class sits on the always-mounted container and the menu is inline-hidden", () => {
  const { container } = render(
    <ContextMenu
      items={items}
      open={false}
      position={{ x: 0, y: 0 }}
      onClose={jest.fn()}
    />,
  );

  const themed = container.querySelector(".themed");
  expect(themed).not.toBeNull();
  expect(themed?.classList.contains("szh-menu-container")).toBe(true);
  // The closed menu stays mounted but is hidden by INLINE styles, which no
  // stylesheet can override -- so chrome nested under .szh-menu is safe while
  // closed, and only container-level styling could ever paint a closed box.
  const menu = container.querySelector<HTMLElement>(".szh-menu");
  expect(menu).not.toBeNull();
  expect(menu?.style.display).toBe("none");
});

it("shows every action inside the themed menu element while open", () => {
  const { container } = render(
    <ContextMenu
      open
      items={items}
      position={{ x: 40, y: 40 }}
      onClose={jest.fn()}
    />,
  );

  const menu = container.querySelector(".szh-menu");
  expect(menu).not.toBeNull();
  expect(menu?.closest(".themed")).not.toBeNull();
  expect(screen.getByText("Deploy")).toBeTruthy();
  expect(screen.getByText("Publish")).toBeTruthy();
});

it("keeps the container class free of direct declarations in the stylesheet", () => {
  // Jest runs with the app directory as its working directory.
  const scss = readFileSync(
    "src/lib/components/ContextMenu/ContextMenu.module.scss",
    "utf8",
  );

  const themedBlock = scss.slice(scss.indexOf(".themed {"));
  const beforeFirstNested = themedBlock.slice(
    0,
    themedBlock.indexOf(":global"),
  );
  // Any `property: value;` line here would style the always-mounted container.
  expect(beforeFirstNested).not.toMatch(/^\s+[a-z-]+\s*:/m);
});
