/**
 * @jest-environment jsdom
 */
import type { RunState } from "@f1r3fly-io/embers-client-sdk";
import type React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ModalProvider } from "@/lib/providers/modal/ModalProvider";
import AgentTeamRun from "@/pages/AgentTeamRun/AgentTeamRun";

// A completed run's public page is metadata-only; the full output value is
// released exclusively through the owner-signed two-phase reveal. The
// inspector must offer that reveal to the signed-in owner, keep it away from
// suspended runs (whose surface is the command form), and route signed-out
// visitors through the login return-path contract.

const SEND_RESPONSE = {
  answer: "Every hot cycle must cross a progress boundary.",
  archived: false,
  question: "What is the progress boundary rule?",
};

const mockReveal = jest.fn(async (..._args: unknown[]) =>
  Promise.resolve({ prepareResponse: {}, sendResponse: SEND_RESPONSE }),
);

let mockWalletReady = true;

jest.mock("@/lib/providers/wallet/useApi", () => ({
  useWalletState: () => ({
    embers: { agentsTeams: { command: jest.fn(), revealOutput: mockReveal } },
    ready: mockWalletReady,
  }),
}));

const mockLocation = { hash: "", pathname: "/runs/run-55", search: "" };
let mockLinkProps: { state?: unknown; to?: string } = {};

jest.mock("react-router-dom", () => ({
  Link: ({
    children,
    ...props
  }: React.PropsWithChildren<{ state?: unknown; to: string }>) => {
    mockLinkProps = props;
    return <a href={props.to}>{children}</a>;
  },
  useLocation: () => mockLocation,
  useParams: () => ({ runId: "run-55" }),
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

function runState(status: string): RunState {
  return {
    agentsTeam: "rho:id:team-under-test",
    approvalAuthorityGrants: [],
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    definitionHash: "hash-A",
    events: [],
    revision: 5n,
    runId: "run-55",
    status,
    waitIds: status === "suspended" ? ["wait-approval-1"] : [],
  } as unknown as RunState;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockLinkProps = {};
  mockWalletReady = true;
  window.API_URL = "http://api.test";
  mockRunState = runState("completed");

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

describe("the owner-signed full-response reveal", () => {
  it("reveals the value for the signed-in owner of a completed run", async () => {
    renderInspector();

    fireEvent.click(await screen.findByText("Reveal full response"));

    await waitFor(() => expect(mockReveal).toHaveBeenCalledTimes(1));
    expect(mockReveal).toHaveBeenCalledWith("run-55");

    const rendered = await screen.findByTestId("reveal-result-json");
    expect(rendered.textContent).toContain('"archived": false');
    expect(rendered.textContent).toContain("progress boundary");
    expect(
      screen.getByText("Full response (visible only to you)"),
    ).toBeTruthy();
  });

  it("offers no reveal on a suspended run", async () => {
    mockRunState = runState("suspended");
    renderInspector();

    expect(await screen.findByText("Send an authenticated command")).toBeTruthy();
    expect(screen.queryByText("Reveal full response")).toBeNull();
  });

  it("routes a signed-out visitor to login with the return path", async () => {
    mockWalletReady = false;
    renderInspector();

    expect(
      await screen.findByText(/wallet that started this run/),
    ).toBeTruthy();
    expect(screen.queryByText("Reveal full response")).toBeNull();
    expect(mockLinkProps.to).toBe("/login");
    // Identity, not shape: the page forwards its own location object.
    expect((mockLinkProps.state as { from?: unknown }).from).toBe(mockLocation);
  });

  it("surfaces the backend's refusal to a non-owner signer", async () => {
    mockReveal.mockRejectedValueOnce(
      new Error("the signer does not hold reveal authority"),
    );
    renderInspector();

    fireEvent.click(await screen.findByText("Reveal full response"));

    expect(
      await screen.findByText(/does not hold reveal authority/),
    ).toBeTruthy();
    expect(screen.queryByTestId("reveal-result-json")).toBeNull();
  });
});
