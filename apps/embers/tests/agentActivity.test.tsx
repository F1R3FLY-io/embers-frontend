/**
 * @jest-environment jsdom
 */

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const unlockTrace = jest.fn();
const readTrace = jest.fn();
const wallet = {
  embers: { agentsTeams: { readTrace, unlockTrace } },
  ready: true,
};
jest.mock("@/lib/providers/wallet/useApi", () => ({
  useWalletState: () => wallet,
}));

import { AgentActivity } from "@/pages/AgentTeamRun/AgentActivity";

beforeEach(() => {
  jest.clearAllMocks();
  unlockTrace.mockResolvedValue({
    accessToken: "private-session",
    expiresAt: Date.now() + 600000,
  });
  HTMLElement.prototype.scrollIntoView = jest.fn();
});

it("keeps repeated names and nested executions separate and displays their outputs", async () => {
  readTrace.mockResolvedValue({
    entries: [
      {
        agentName: "Review team",
        executionId: "root",
        id: "parent",
        input: "brief",
        inputAvailable: true,
        nodeId: "parent",
        output: "decision",
        outputAvailable: true,
        sequence: 0,
        status: "completed",
      },
      {
        agentName: "Critic",
        executionId: "parent",
        id: "first",
        input: "first input",
        inputAvailable: true,
        nodeId: "critic",
        output: "first critique",
        outputAvailable: true,
        sequence: 1,
        status: "completed",
      },
      {
        agentName: "Critic",
        attempt: 2,
        context: { iterations: { loop: 1 } },
        executionId: "parent",
        id: "second",
        input: "revised input",
        inputAvailable: true,
        nodeId: "critic",
        output: "second critique",
        outputAvailable: true,
        sequence: 2,
        status: "completed",
      },
    ],
    legacyNotice: null,
    nextOffset: null,
  });
  const user = userEvent.setup();
  render(<AgentActivity active={false} runId="run" />);
  expect(screen.queryByText("first critique")).not.toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Unlock agent history" }),
  );
  await waitFor(() =>
    expect(screen.getAllByText("Critic", { exact: true })).toHaveLength(2),
  );
  await user.click(screen.getAllByText("Critic", { exact: true })[0]);
  expect(screen.getByText("first critique")).toBeVisible();
  await user.click(screen.getAllByText("Critic", { exact: true })[1]);
  expect(screen.getByText("second critique")).toBeVisible();
  expect(screen.getByText(/iteration 2/)).toBeVisible();
  expect(readTrace).toHaveBeenCalledWith(
    "run",
    "private-session",
    0,
    expect.anything(),
  );
});

it("reports missing older inputs and does not pretend a failed unlock succeeded", async () => {
  unlockTrace.mockRejectedValue(
    new Error("Sign in with the wallet that owns this run."),
  );
  const user = userEvent.setup();
  render(<AgentActivity active={false} runId="run" />);
  await user.click(
    screen.getByRole("button", { name: "Unlock agent history" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "wallet that owns",
  );
  expect(readTrace).not.toHaveBeenCalled();
});

it("refreshes active history and clears private outputs when authorization expires", async () => {
  jest.useFakeTimers();
  try {
    unlockTrace.mockResolvedValue({
      accessToken: "short-session",
      expiresAt: Date.now() + 7000,
    });
    const entry = {
      agentName: "Live critic",
      executionId: "root",
      id: "live",
      inputAvailable: false,
      nodeId: "critic",
      outputAvailable: false,
      sequence: 0,
      status: "running",
    };
    readTrace.mockResolvedValueOnce({
      entries: [entry],
      legacyNotice: null,
      nextOffset: null,
    });
    readTrace.mockResolvedValue({
      entries: [
        {
          ...entry,
          output: "private completed critique",
          outputAvailable: true,
          status: "completed",
        },
      ],
      legacyNotice: null,
      nextOffset: null,
    });
    render(<AgentActivity active runId="live-run" />);
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Unlock agent history" }),
      );
    });
    expect(readTrace).toHaveBeenCalledTimes(1);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(3000);
    });
    expect(readTrace).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByText("Live critic", { exact: true }));
    expect(screen.getByText("private completed critique")).toBeVisible();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(4001);
    });
    expect(
      screen.queryByText("private completed critique"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Unlock agent history" }),
    ).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("expired");
  } finally {
    jest.useRealTimers();
  }
});
