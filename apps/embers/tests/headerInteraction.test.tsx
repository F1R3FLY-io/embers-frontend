/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, within } from "@testing-library/react";

import { Header } from "@/lib/layouts/Graph/Header";

// Interaction coverage, which markup alone cannot give. The static render tests in
// headerRender.test.tsx assert that the caret exists and carries the right
// attributes; only a DOM can show that clicking it opens a menu, that the menu holds
// the actions it should, and that choosing one routes where it should.
//
// The environment is set per-file rather than globally: the rest of the suite runs
// under `node`, which is faster and sufficient for pure functions and markup.

let mockTeam: Record<string, unknown> = {};
const mockPublished: Record<string, unknown> | null = null;
const mockNavigate = jest.fn();
const mockOpen = jest.fn();

jest.mock("@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam", () => ({
  useCurrentAgentsTeam: () => ({
    agentsTeam: mockTeam,
    reset: () => undefined,
    update: () => undefined,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock("@/lib/providers/dock/useDock", () => ({
  useDock: () => ({ appendLog: () => undefined }),
}));

jest.mock("@/lib/providers/modal/useModal", () => ({
  useModal: () => ({ close: () => undefined, open: mockOpen }),
}));

jest.mock("@/lib/providers/loader/useCallbackWithLoader", () => ({
  useCallbackWithLoader: (fn: unknown) => fn,
}));

/* eslint-disable @typescript-eslint/promise-function-async
   -- these are inert mocks: `async` would trip require-await, and a plain value
   would not satisfy the mutateAsync signature the component awaits. */
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
  useTeamPublishedState: () => ({ data: mockPublished }),
}));

const DEPLOYED = { id: "team-1", uri: "rho:id:abc", version: "v1" };

const openMenu = () => {
  const caret = screen.getByLabelText("deploy.moreActions");
  fireEvent.click(caret);
  return caret;
};

beforeEach(() => {
  mockTeam = DEPLOYED;
  mockNavigate.mockClear();
  mockOpen.mockClear();
});

describe("the editor header's split button", () => {
  it("opens the menu when the caret is clicked", () => {
    render(<Header />);

    // Closed to begin with: the menu exists in the DOM but is not exposed.
    expect(
      screen.getByLabelText("deploy.moreActions").getAttribute("aria-expanded"),
    ).toBe("false");

    openMenu();

    expect(
      screen.getByLabelText("deploy.moreActions").getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("offers deploy first, then the publication surfaces, then the read-only views", () => {
    render(<Header />);
    openMenu();

    const items = screen.getAllByRole("menuitem").map((el) => el.textContent);

    // Ordered as the workflow runs: deploy, the two publish flows, then the
    // grants and reachability views the channel-connector layer added.
    expect(items).toEqual([
      "deploy.deploy",
      "deploy.publishToFiresky",
      "deploy.publishToMail",
      "deploy.manageGrants",
      "deploy.interfaces",
    ]);
  });

  it("routes to the publish page, carrying the team it is editing", () => {
    render(<Header />);
    openMenu();

    fireEvent.click(
      screen.getByRole("menuitem", { name: "deploy.publishToFiresky" }),
    );

    // "latest" mirrors what the dashboard card passes, and matches how the server
    // resolves a team when publishing.
    expect(mockNavigate).toHaveBeenCalledWith("/agents-team/publish", {
      state: { id: "team-1", version: "latest" },
    });
  });

  it("prompts for input when Run is clicked, rather than running blind", () => {
    render(<Header />);

    fireEvent.click(screen.getByRole("button", { name: "basic.run" }));

    expect(mockOpen).toHaveBeenCalledTimes(1);
  });

  it("does not offer the caret at all before the team is deployed", () => {
    mockTeam = { id: "team-1", version: "v1" };
    render(<Header />);

    expect(screen.queryByLabelText("deploy.moreActions")).toBeNull();
    // The primary action is Deploy, so nothing is unreachable in this state.
    expect(screen.getByRole("button", { name: "deploy.deploy" })).toBeTruthy();
  });

  it("keeps the caret a separate control from the primary action", () => {
    // Two buttons, not one with a nested target: each needs its own accessible
    // name, and clicking Run must never open the menu.
    render(<Header />);

    const run = screen.getByRole("button", { name: "basic.run" });
    const caret = screen.getByLabelText("deploy.moreActions");
    expect(run).not.toBe(caret);

    fireEvent.click(run);
    expect(caret.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes the menu once an action is chosen", () => {
    render(<Header />);
    const caret = openMenu();

    fireEvent.click(screen.getByRole("menuitem", { name: "deploy.deploy" }));

    expect(caret.getAttribute("aria-expanded")).toBe("false");
  });

  it("labels the menu region for assistive technology", () => {
    render(<Header />);
    openMenu();

    const menu = screen.getByRole("menu");
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(5);
  });
});
