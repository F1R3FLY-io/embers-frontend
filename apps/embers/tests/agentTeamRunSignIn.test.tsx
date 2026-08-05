/**
 * @jest-environment jsdom
 */
import type { RunState } from "@f1r3fly-io/embers-client-sdk";
import type React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import { ModalProvider } from "@/lib/providers/modal/ModalProvider";
import AgentTeamRun from "@/pages/AgentTeamRun/AgentTeamRun";

// A suspended run's inspector must never be a dead end for a signed-out
// visitor: the sign-in prompt has to be a real client-side Link that carries
// the inspector's own location as the auth return path (the wallet key lives
// in memory only, so any full page load would drop the fresh session — the
// whole round-trip must stay inside the SPA).

const mockLocation = { hash: "", pathname: "/runs/run-99", search: "" };
let mockLinkProps: { state?: unknown; to?: string } = {};

jest.mock("@/lib/providers/wallet/useApi", () => ({
  useWalletState: () => ({ ready: false, setKey: () => undefined }),
}));

jest.mock("react-router-dom", () => ({
  Link: ({
    children,
    ...props
  }: React.PropsWithChildren<{ state?: unknown; to: string }>) => {
    mockLinkProps = props;
    return <a href={props.to}>{children}</a>;
  },
  useLocation: () => mockLocation,
  useParams: () => ({ runId: "run-99" }),
}));

let mockRunState: RunState;
// The real SDK pulls cryptographic dependencies (z32, blakejs) that need
// runtime globals jsdom does not provide; the page only consumes the command
// kinds and the run-state parser, so the mock supplies exactly those.
jest.mock("@f1r3fly-io/embers-client-sdk", () => ({
  RunCommandKind: {
    Approve: "approve",
    Cancel: "cancel",
    Event: "event",
    Migrate: "migrate",
    Reject: "reject",
    Retry: "retry",
    Signal: "signal",
    TimerFired: "timerFired",
  },
  RunStateFromJSON: () => mockRunState,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockLinkProps = {};
  window.API_URL = "http://api.test";
  mockRunState = {
    agentsTeam: "rho:id:team-under-test",
    approvalAuthorityGrants: [],
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    definitionHash: "hash-A",
    events: [],
    revision: 3n,
    runId: "run-99",
    status: "suspended",
    waitIds: [],
  } as unknown as RunState;

  globalThis.fetch = jest.fn(async () =>
    Promise.resolve({
      json: async () => Promise.resolve({}),
      ok: true,
      status: 200,
    }),
  ) as unknown as typeof fetch;

  const modalRoot = document.createElement("div");
  modalRoot.id = "modal-root";
  document.body.replaceChildren(modalRoot);
});

function renderInspector() {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <ModalProvider>
        <AgentTeamRun />
      </ModalProvider>
    </QueryClientProvider>,
  );
}

describe("the signed-out inspector's sign-in prompt", () => {
  it("links to /login carrying the inspector's location as the return path", async () => {
    renderInspector();

    expect(await screen.findByText("Sign in")).toBeTruthy();
    expect(mockLinkProps.to).toBe("/login");
    // Identity, not shape: the page forwards its own location object.
    expect((mockLinkProps.state as { from?: unknown }).from).toBe(mockLocation);
  });

  it("keeps the supporting copy and hides the command form", async () => {
    renderInspector();

    expect(
      await screen.findByText(/delegated approver wallet/),
    ).toBeTruthy();
    expect(screen.queryByText("Sign and send")).toBeNull();
  });
});
