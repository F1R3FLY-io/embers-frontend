/**
 * @jest-environment jsdom
 */
import type { RunState } from "@f1r3fly-io/embers-client-sdk";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ModalProvider } from "@/lib/providers/modal/ModalProvider";
import AgentTeamRun from "@/pages/AgentTeamRun/AgentTeamRun";

// The run inspector's two operator tools: timerFired (the scheduler escape
// hatch, deadline prefilled from the run and checked by the kernel) and
// migrate (a definition rebind gated behind an explicit confirmation). These
// tests drive the real form and dialog and assert the exact signed request.

const mockCommand = jest.fn(async (..._args: unknown[]) =>
  Promise.resolve({ status: "resuming" }),
);

jest.mock("@/lib/providers/wallet/useApi", () => ({
  useWalletState: () => ({
    embers: { agentsTeams: { command: mockCommand } },
    ready: true,
  }),
}));

jest.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/runs/run-77" }),
  useParams: () => ({ runId: "run-77" }),
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

const DUE_AT = new Date("2026-08-03T12:00:00.000Z");

beforeEach(() => {
  jest.clearAllMocks();
  window.API_URL = "http://api.test";
  mockRunState = {
    agentsTeam: "rho:id:team-under-test",
    approvalAuthorityGrants: [],
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    definitionHash: "hash-A",
    dueAt: DUE_AT,
    events: [],
    revision: 4n,
    runId: "run-77",
    status: "suspended",
    waitIds: ["wait-timer-1"],
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

describe("timerFired escape hatch", () => {
  it("prefills the deadline from the run and issues the exact command", async () => {
    renderInspector();

    fireEvent.change(await screen.findByLabelText("Command"), {
      target: { value: "timerFired" },
    });

    const deadline =
      screen.getByLabelText<HTMLInputElement>("Expected deadline");
    expect(deadline.value).toBe(DUE_AT.toISOString());

    fireEvent.change(screen.getByLabelText("Exact wait"), {
      target: { value: "wait-timer-1" },
    });
    fireEvent.click(screen.getByText("Sign and send"));

    await waitFor(() => expect(mockCommand).toHaveBeenCalledTimes(1));
    expect(mockCommand).toHaveBeenCalledWith("run-77", {
      expectedDeadline: DUE_AT,
      expectedRevision: 4n,
      type: "timerFired",
      waitId: "wait-timer-1",
    });
  });

  it("surfaces the kernel's deadline-mismatch rejection", async () => {
    mockCommand.mockRejectedValueOnce(
      new Error("timer wait wait-timer-1 deadline mismatch"),
    );
    renderInspector();

    fireEvent.change(await screen.findByLabelText("Command"), {
      target: { value: "timerFired" },
    });
    fireEvent.change(screen.getByLabelText("Exact wait"), {
      target: { value: "wait-timer-1" },
    });
    fireEvent.click(screen.getByText("Sign and send"));

    expect(await screen.findByText(/deadline mismatch/)).toBeTruthy();
  });
});

describe("migrate behind an explicit confirmation", () => {
  function fillMigration() {
    fireEvent.change(screen.getByLabelText("To definition hash"), {
      target: { value: "hash-B" },
    });
    fireEvent.change(screen.getByLabelText("Target team URI"), {
      target: { value: "rho:id:next-team" },
    });
    fireEvent.change(screen.getByLabelText("State patch (JSON array)"), {
      target: {
        value: '[{"operation":"set","path":["cursor"],"value":0}]',
      },
    });
  }

  it("prefills the source hash, summarizes the rebind, and sends on confirm", async () => {
    renderInspector();

    fireEvent.change(await screen.findByLabelText("Command"), {
      target: { value: "migrate" },
    });

    const fromHash = screen.getByLabelText<HTMLInputElement>(
      "From definition hash",
    );
    expect(fromHash.value).toBe("hash-A");

    fillMigration();
    fireEvent.click(screen.getByText("Sign and send"));

    expect(await screen.findByText(/Rebind this run/)).toBeTruthy();
    fireEvent.click(screen.getByText("Confirm"));

    await waitFor(() => expect(mockCommand).toHaveBeenCalledTimes(1));
    expect(mockCommand).toHaveBeenCalledWith("run-77", {
      expectedRevision: 4n,
      fromDefinitionHash: "hash-A",
      statePatch: [{ operation: "set", path: ["cursor"], value: 0 }],
      targetTeamUri: "rho:id:next-team",
      toDefinitionHash: "hash-B",
      type: "migrate",
    });
  });

  it("a declined confirmation sends nothing", async () => {
    renderInspector();

    fireEvent.change(await screen.findByLabelText("Command"), {
      target: { value: "migrate" },
    });
    fillMigration();
    fireEvent.click(screen.getByText("Sign and send"));

    fireEvent.click(await screen.findByText("Cancel"));
    await waitFor(() =>
      expect(screen.queryByText(/Rebind this run/)).toBeNull(),
    );
    expect(mockCommand).not.toHaveBeenCalled();
  });

  it("rejects a state patch that is not a JSON array before signing", async () => {
    renderInspector();

    fireEvent.change(await screen.findByLabelText("Command"), {
      target: { value: "migrate" },
    });
    fillMigration();
    fireEvent.change(screen.getByLabelText("State patch (JSON array)"), {
      target: { value: "{}" },
    });
    fireEvent.click(screen.getByText("Sign and send"));
    fireEvent.click(await screen.findByText("Confirm"));

    expect(
      await screen.findByText(/State patch must be a JSON array/),
    ).toBeTruthy();
    expect(mockCommand).not.toHaveBeenCalled();
  });
});
