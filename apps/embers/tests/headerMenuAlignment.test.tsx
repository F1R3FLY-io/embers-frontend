/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";

import { Header } from "@/lib/layouts/Graph/Header";

// The caret's dropdown must hang from the split button's RIGHT edge: anchored
// at the caret's bottom-right corner with end alignment, so the menu's right
// edge lines up with the combo button's right edge rather than the Run/caret
// divider. jsdom performs no layout, so the geometry contract is pinned at
// the seam: the exact anchor point and alignment props the Header hands to
// the ContextMenu.

const contextMenuProps = jest.fn();

jest.mock("@/lib/components/ContextMenu", () => ({
  ContextMenu: (props: Record<string, unknown>) => {
    contextMenuProps(props);
    return null;
  },
}));

jest.mock("@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam", () => ({
  useCurrentAgentsTeam: () => ({
    agentsTeam: { id: "team-1", uri: "rho:id:abc", version: "v1" },
    reset: () => undefined,
    update: () => undefined,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock("@/lib/providers/dock/useDock", () => ({
  useDock: () => ({ appendLog: () => undefined }),
}));

jest.mock("@/lib/providers/modal/useModal", () => ({
  useModal: () => ({ close: () => undefined, open: jest.fn() }),
}));

jest.mock("@/lib/providers/loader/useCallbackWithLoader", () => ({
  useCallbackWithLoader: (fn: unknown) => fn,
}));

/* eslint-disable @typescript-eslint/promise-function-async
   -- inert mocks: `async` would trip require-await, and a plain value would
   not satisfy the mutateAsync signature the component awaits. */
jest.mock("@/lib/providers/loader/useMutationResultWithLoader", () => ({
  useMutationResultWithLoader: () => ({
    mutateAsync: () => Promise.resolve(undefined),
  }),
}));

jest.mock("@/lib/queries", () => ({
  useCreateAgentsTeamMutation: () => ({
    mutateAsync: () => Promise.resolve(undefined),
  }),
  useRunAgentsTeamMutation: () => ({
    mutateAsync: () => Promise.resolve(undefined),
  }),
  useSaveAgentsTeamMutation: () => ({
    mutateAsync: () => Promise.resolve(undefined),
  }),
  useTeamPublishedState: () => ({ data: null }),
}));
/* eslint-enable @typescript-eslint/promise-function-async */

const CARET_RECT = {
  bottom: 40,
  height: 32,
  left: 260,
  right: 300,
  toJSON: () => ({}),
  top: 8,
  width: 40,
  x: 260,
  y: 8,
} as DOMRect;

describe("the caret menu's anchor geometry", () => {
  it("hangs the menu from the caret's bottom-right corner, end-aligned", () => {
    jest
      .spyOn(Element.prototype, "getBoundingClientRect")
      .mockReturnValue(CARET_RECT);

    render(<Header />);
    fireEvent.click(screen.getByLabelText("deploy.moreActions"));

    const lastCall = contextMenuProps.mock.lastCall as
      | [Record<string, unknown>]
      | undefined;
    const props = lastCall?.[0] ?? {};
    expect(props.open).toBe(true);
    // Right corner, not the divider between Run and the caret.
    expect(props.position).toEqual({ x: CARET_RECT.right, y: CARET_RECT.bottom + 4 });
    expect(props.align).toBe("end");
    expect(props.direction).toBe("bottom");
  });
});
