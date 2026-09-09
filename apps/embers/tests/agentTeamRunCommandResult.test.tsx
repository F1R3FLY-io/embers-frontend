/**
 * @jest-environment jsdom
 */
import type { RunState } from "@f1r3fly-io/embers-client-sdk";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ModalProvider } from "@/lib/providers/modal/ModalProvider";
import AgentTeamRun from "@/pages/AgentTeamRun/AgentTeamRun";

// The public run ledger is metadata-only by design, but a command's HTTP
// response returns the resulting value over the signer's authenticated
// channel. The inspector must surface that value after a successful command
// (the demo's approve moment shows the escalated answer here) instead of
// discarding it.

const SEND_RESPONSE = {
  disposition: "completed",
  value: {
    answer: "Every hot cycle must cross a progress boundary.",
    feedback: "GOOD - grounded in the retrieved context.",
    question: "What is the progress boundary rule?",
    score: 85,
  },
};

const mockCommand = jest.fn(async (..._args: unknown[]) =>
  Promise.resolve({ prepareResponse: {}, sendResponse: SEND_RESPONSE }),
);

jest.mock("@/lib/providers/wallet/useApi", () => ({
  useWalletState: () => ({
    embers: {
      agentsTeams: { command: mockCommand },
      wallets: { address: { toString: () => "test-wallet" } },
    },
    ready: true,
  }),
}));

jest.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/runs/run-88" }),
  useNavigate: () => jest.fn(),
  useParams: () => ({ runId: "run-88" }),
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
  window.API_URL = "http://api.test";
  mockRunState = {
    agentsTeam: "rho:id:team-under-test",
    approvalAuthorityGrants: [],
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    definitionHash: "hash-A",
    events: [],
    revision: 7n,
    runId: "run-88",
    status: "suspended",
    waitIds: ["wait-approval-1"],
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

describe("command result surface", () => {
  it("shows the command's returned value after a successful approve", async () => {
    renderInspector();

    fireEvent.change(await screen.findByLabelText("Command"), {
      target: { value: "approve" },
    });
    fireEvent.change(screen.getByLabelText("Exact wait"), {
      target: { value: "wait-approval-1" },
    });
    fireEvent.click(screen.getByText("Sign and send"));

    await waitFor(() => expect(mockCommand).toHaveBeenCalledTimes(1));

    const rendered = await screen.findByTestId("command-result-json");
    expect(rendered.textContent).toContain('"score": 85');
    expect(rendered.textContent).toContain("progress boundary");
    expect(
      screen.getByText("Command result (visible only to you)"),
    ).toBeTruthy();
  });

  it("renders no result block before a command succeeds", () => {
    renderInspector();

    expect(screen.queryByTestId("command-result-json")).toBeNull();
  });
});
