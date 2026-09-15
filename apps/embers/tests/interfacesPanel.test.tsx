/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";

import { InterfacesPanel } from "@/lib/components/InterfacesPanel/InterfacesPanel";

// The panel's contract is the three-valued discipline: "unknown" is a state of
// its own and must never collapse into "missing". Mail reachability is null by
// design (the server does not probe SMTP), a published-and-active F1R3SKY row
// with a live account reads reachable, and the chat row derives from grant
// presence.

interface ChannelsResult {
  data?: {
    chat: { activeGrantCount: string; principals: string[] };
    firesky: {
      accountExists: boolean | null;
      active: boolean | null;
      handle: string | null;
    } | null;
    mail: { active: boolean; address: string; reachable: boolean | null }[];
  };
  isError: boolean;
  isPending: boolean;
}

let mockChannels: ChannelsResult;
jest.mock("@/lib/queries", () => ({
  usePublishedChannels: () => mockChannels,
}));

describe("interfaces panel", () => {
  it("renders an active mail binding with the unknown state, never as missing", () => {
    mockChannels = {
      data: {
        chat: { activeGrantCount: "0", principals: [] },
        firesky: null,
        mail: [
          { active: true, address: "crew@agents.test", reachable: null },
        ],
      },
      isError: false,
      isPending: false,
    };
    render(<InterfacesPanel teamId="team-1" />);

    const mailRow = screen.getByTestId("interfaces-mail-crew@agents.test");
    expect(
      mailRow.querySelector('[data-testid="interfaces-state-unknown"]'),
    ).toBeTruthy();
  });

  it("renders a live, active publication as reachable", () => {
    mockChannels = {
      data: {
        chat: { activeGrantCount: "0", principals: [] },
        firesky: { accountExists: true, active: true, handle: "crew.test" },
        mail: [],
      },
      isError: false,
      isPending: false,
    };
    render(<InterfacesPanel teamId="team-1" />);

    const fireskyRow = screen.getByTestId("interfaces-firesky");
    expect(
      fireskyRow.querySelector('[data-testid="interfaces-state-reachable"]'),
    ).toBeTruthy();
  });

  it("renders a destroyed account as unreachable, an unreachable PDS as unknown", () => {
    mockChannels = {
      data: {
        chat: { activeGrantCount: "0", principals: [] },
        firesky: { accountExists: false, active: true, handle: "crew.test" },
        mail: [],
      },
      isError: false,
      isPending: false,
    };
    const { unmount } = render(<InterfacesPanel teamId="team-1" />);
    expect(
      screen
        .getByTestId("interfaces-firesky")
        .querySelector('[data-testid="interfaces-state-unreachable"]'),
    ).toBeTruthy();
    unmount();

    mockChannels = {
      data: {
        chat: { activeGrantCount: "0", principals: [] },
        firesky: { accountExists: null, active: true, handle: "crew.test" },
        mail: [],
      },
      isError: false,
      isPending: false,
    };
    render(<InterfacesPanel teamId="team-1" />);
    expect(
      screen
        .getByTestId("interfaces-firesky")
        .querySelector('[data-testid="interfaces-state-unknown"]'),
    ).toBeTruthy();
  });

  it("derives the chat row from grant presence", () => {
    mockChannels = {
      data: {
        chat: { activeGrantCount: "2", principals: ["a3f9", "b7c1"] },
        firesky: null,
        mail: [],
      },
      isError: false,
      isPending: false,
    };
    render(<InterfacesPanel teamId="team-1" />);

    const chatRow = screen.getByTestId("interfaces-chat");
    expect(
      chatRow.querySelector('[data-testid="interfaces-state-reachable"]'),
    ).toBeTruthy();
  });

  it("keeps loading and failure as their own surfaces", () => {
    mockChannels = { isError: false, isPending: true };
    const { unmount } = render(<InterfacesPanel teamId="team-1" />);
    expect(screen.getByTestId("interfaces-panel-loading")).toBeTruthy();
    unmount();

    mockChannels = { isError: true, isPending: false };
    render(<InterfacesPanel teamId="team-1" />);
    expect(screen.getByTestId("interfaces-panel-error")).toBeTruthy();
  });
});
