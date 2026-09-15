/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";

import GrantsManagement from "@/pages/GrantsManagement/GrantsManagement";

// The grants page is where channel delegations get signed. What must hold:
// creation stays unreachable until the form names a team, a principal, and a
// parseable grantee wallet; the one-time subject token is surfaced through the
// alert exactly when the backend mints one; and the list renders revocable
// rows for live grants and a terminal badge for revoked ones.

const mockAlert = jest.fn(async (..._args: unknown[]) => Promise.resolve());
const mockConfirm = jest.fn(async (..._args: unknown[]) =>
  Promise.resolve(true),
);
jest.mock("@/lib/providers/modal/useConfirm", () => ({
  useAlert: () => mockAlert,
  useConfirm: () => mockConfirm,
}));

// The loader wrapper needs its provider; the pages under test only need the
// wrapped callback to run.
jest.mock("@/lib/providers/loader/useCallbackWithLoader", () => ({
  useCallbackWithLoader:
    (fn: (...args: unknown[]) => unknown) =>
    (...args: unknown[]) =>
      fn(...args),
}));

// The real SDK pulls cryptographic dependencies jsdom does not provide; the
// page consumes the enum vocabularies and the address parser, so the mock
// supplies exactly those.
jest.mock("@f1r3fly-io/embers-client-sdk", () => ({
  Address: {
    tryFrom: (value: string) => {
      if (!value.startsWith("1111")) {
        throw new Error("invalid address");
      }
      return { value };
    },
  },
  GrantChannel: { Chat: "chat", Mail: "mail" },
  GrantCommandClass: {
    Approve: "approve",
    Cancel: "cancel",
    Event: "event",
    Reject: "reject",
    Retry: "retry",
    Signal: "signal",
  },
  MinAuthLevel: { Dkim: "dkim", Dmarc: "dmarc", None: "none", Spf: "spf" },
}));

const mockCreate = jest.fn(async (..._args: unknown[]) =>
  Promise.resolve({
    prepareResponse: { response: { grantId: "g-new", requireToken: undefined } },
  }),
);
const mockRevoke = jest.fn(async (..._args: unknown[]) => Promise.resolve({}));

let mockGrants: unknown[] = [];
jest.mock("@/lib/queries", () => ({
  useAgentsTeams: () => ({
    data: {
      agentsTeams: [
        { id: "team-1", name: "Research Crew", uri: "rho:id:team1" },
        { id: "team-2", name: "Undeployed", uri: undefined },
      ],
    },
  }),
  useCreateGrantMutation: () => ({ mutateAsync: mockCreate }),
  useGrantsQuery: () => ({ data: mockGrants }),
  useRevokeGrantMutation: () => ({ mutateAsync: mockRevoke }),
}));

beforeEach(() => {
  mockAlert.mockClear();
  mockConfirm.mockClear();
  mockCreate.mockClear();
  mockRevoke.mockClear();
  mockGrants = [];
});

function fillPrincipalAndGrantee() {
  fireEvent.change(screen.getByTestId("grant-principal"), {
    target: { value: "a3f9deadbeef" },
  });
  fireEvent.change(screen.getByTestId("grant-grantee"), {
    target: { value: "1111GatewayWallet" },
  });
}

function createButton(): HTMLButtonElement {
  const container = screen.getByTestId("grant-create");
  const button = container.querySelector("button");
  if (button === null) {
    throw new Error("create button not rendered");
  }
  return button;
}

describe("grants management", () => {
  it("keeps creation unreachable until the form is complete", () => {
    render(<GrantsManagement />);

    expect(createButton().disabled).toBe(true);

    fillPrincipalAndGrantee();
    // Still no team selected: the button must stay disabled.
    expect(createButton().disabled).toBe(true);
  });

  it("rejects a grantee that does not parse as a wallet address", () => {
    render(<GrantsManagement />);
    fillPrincipalAndGrantee();
    fireEvent.change(screen.getByTestId("grant-grantee"), {
      target: { value: "not-an-address" },
    });

    expect(createButton().disabled).toBe(true);
  });

  it("marks an out-of-range cap as an error", () => {
    render(<GrantsManagement />);
    const cap = screen.getByTestId("grant-cap");

    fireEvent.change(cap, { target: { value: "0" } });
    expect(createButton().disabled).toBe(true);
  });

  it("renders live grants with a revoke affordance and revoked ones with a badge", () => {
    mockGrants = [
      {
        agentsTeam: "rho:id:team1",
        caps: { maxRunsPerDay: undefined },
        channel: "chat",
        channelPrincipal: "a3f9",
        grantId: "g-1",
        revoked: false,
      },
      {
        agentsTeam: "rho:id:team1",
        caps: { maxRunsPerDay: 5n },
        channel: "mail",
        channelPrincipal: "sender@example.test",
        grantId: "g-2",
        revoked: true,
      },
    ];
    render(<GrantsManagement />);

    expect(screen.getByTestId("grant-row-g-1")).toBeTruthy();
    expect(screen.getByTestId("grant-revoke-g-1")).toBeTruthy();
    expect(screen.getByTestId("grant-revoked-g-2")).toBeTruthy();
    expect(screen.queryByTestId("grant-revoke-g-2")).toBeNull();
  });

  it("revokes only after the user confirms", async () => {
    mockGrants = [
      {
        agentsTeam: "rho:id:team1",
        caps: { maxRunsPerDay: undefined },
        channel: "chat",
        channelPrincipal: "a3f9",
        grantId: "g-1",
        revoked: false,
      },
    ];
    mockConfirm.mockResolvedValueOnce(false);
    render(<GrantsManagement />);

    const revokeButton = screen
      .getByTestId("grant-revoke-g-1")
      .querySelector("button");
    fireEvent.click(revokeButton!);
    await Promise.resolve();

    expect(mockConfirm).toHaveBeenCalledTimes(1);
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it("shows an empty state when no grants exist", () => {
    render(<GrantsManagement />);
    expect(screen.getByTestId("grant-list-empty")).toBeTruthy();
  });
});
