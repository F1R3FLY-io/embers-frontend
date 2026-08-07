/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const navigate = jest.fn();
const appendLog = jest.fn();
const update = jest.fn();

let currentAgent: {
  iconUrl?: string;
  id?: string;
  name?: string;
  version?: string;
} = {};

const createMutation = {
  isPending: false,
  mutateAsync: jest.fn(),
};
const saveMutation = {
  isPending: false,
  mutateAsync: jest.fn(),
};
let saveMutationAgentId: string | undefined;

jest.mock("@/lib/queries", () => ({
  useCreateAgentMutation: () => createMutation,
  useSaveAgentMutation: (id: string) => {
    saveMutationAgentId = id;
    return saveMutation;
  },
}));

jest.mock("@/lib/providers/currentAgent/useCurrentAgent", () => ({
  useCurrentAgent: () => ({ agent: currentAgent, update }),
}));

jest.mock("@/lib/providers/dock/useDock", () => ({
  useDock: () => ({ appendDeploy: jest.fn(), appendLog }),
}));

// The real wrapper shows the spinner, awaits, hides it in a `finally`, and
// lets the rejection through. Loader visibility is covered by
// loaderProvider.test.tsx, so what is stood in for here is only the pass-
// through -- with the rejection absorbed rather than rethrown. That matches
// where it actually goes in the app: `Button` invokes onClick with `void`, so
// nothing downstream handles it either. Absorbing it here keeps an assertion
// about REPORTING from failing over a rejection nobody catches in production.
jest.mock("@/lib/providers/loader/useCallbackWithLoader", () => ({
  useCallbackWithLoader: (fn: () => Promise<void>) => async () => {
    try {
      await fn();
    } catch {
      // Deliberately swallowed; see above.
    }
  },
}));

jest.mock("react-router-dom", () => ({ useNavigate: () => navigate }));

import { Header } from "@/lib/layouts/Code/Header";

// Saving an agent from the editor: the branch between creating one and adding a
// version to an existing one.
//
// Nothing tested it, and the two paths differ in what they return and what the
// caller must then remember. Creation is the one that matters most: the id only
// exists in the server's response, so failing to carry it back leaves the
// editor thinking it is still editing a new agent -- and the next save creates
// a SECOND one instead of a version.

function renderHeader(code = "new x in { Nil }") {
  return render(<Header getCode={() => code} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  currentAgent = { iconUrl: "logo.png", name: "Researcher" };
  createMutation.isPending = false;
  saveMutation.isPending = false;
  createMutation.mutateAsync.mockResolvedValue({
    prepareResponse: { response: { id: "agent-new", version: "version-1" } },
    waitForFinalization: Promise.resolve(),
  });
  saveMutation.mutateAsync.mockResolvedValue({
    prepareResponse: { response: { version: "version-2" } },
    waitForFinalization: Promise.resolve(),
  });
});

describe("a new agent", () => {
  it("is created rather than saved", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(createMutation.mutateAsync).toHaveBeenCalledTimes(1);
    expect(saveMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it("sends the editor's current code, name, and icon", async () => {
    const user = userEvent.setup();
    renderHeader("contract main(@x, ret) = { ret!(x) }");

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(createMutation.mutateAsync).toHaveBeenCalledWith({
      code: "contract main(@x, ret) = { ret!(x) }",
      logo: "logo.png",
      name: "Researcher",
    });
  });

  it("remembers the id the server minted", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    // The id exists only in the response. Without carrying it back the editor
    // still looks like a new agent, and the next save would create a SECOND
    // one rather than a version of this one.
    expect(update).toHaveBeenCalledWith({
      id: "agent-new",
      version: "version-1",
    });
  });

  it("waits for the deploy to finalize before reporting success", async () => {
    const user = userEvent.setup();
    let finalized = false;
    createMutation.mutateAsync.mockResolvedValue({
      prepareResponse: { response: { id: "agent-new", version: "version-1" } },
      waitForFinalization: Promise.resolve().then(() => {
        finalized = true;
      }),
    });
    renderHeader();

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    // Logging "saved" before the chain confirms it is how a user is told their
    // work is safe while it is still in flight.
    expect(finalized).toBe(true);
    expect(appendLog).toHaveBeenCalledWith(
      expect.stringContaining("agent-new"),
      "info",
    );
  });
});

describe("an existing agent", () => {
  beforeEach(() => {
    currentAgent = { iconUrl: "logo.png", id: "agent-1", name: "Researcher" };
  });

  it("adds a version rather than creating another agent", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(saveMutation.mutateAsync).toHaveBeenCalledTimes(1);
    expect(createMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it("saves against the agent currently open", () => {
    renderHeader();

    // The mutation is bound to an id at hook time, so a mismatch here would
    // write a version onto a different agent.
    expect(saveMutationAgentId).toBe("agent-1");
  });

  it("keeps the existing id and records the new version", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(update).toHaveBeenCalledWith({
      id: "agent-1",
      version: "version-2",
    });
  });
});

describe("before the editor has loaded", () => {
  // `getCode` returns undefined until the editor is ready, which is NOT the
  // same as a document that is genuinely empty. Treating them alike is data
  // loss: saving an existing agent in that window would append a version whose
  // code is empty, and that version is the one a team compiles.

  it("refuses to save rather than writing an empty document", async () => {
    const user = userEvent.setup();
    render(<Header getCode={() => undefined} />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(createMutation.mutateAsync).not.toHaveBeenCalled();
    expect(saveMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it("says why, in the only place a failure is reported", async () => {
    const user = userEvent.setup();
    render(<Header getCode={() => undefined} />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    // There is no toast system; the dock is where this reaches the user, and a
    // silent refusal would be indistinguishable from a silent success.
    expect(appendLog).toHaveBeenCalledWith(
      expect.stringContaining("still loading"),
      "error",
    );
  });

  it("does not overwrite an existing agent's code either", async () => {
    const user = userEvent.setup();
    currentAgent = { iconUrl: "logo.png", id: "agent-1", name: "Researcher" };
    render(<Header getCode={() => null} />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    // The worse half of the bug: this path appends a VERSION, so an empty save
    // replaces what the agent currently compiles to.
    expect(saveMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it("does not navigate to deploy either", async () => {
    const user = userEvent.setup();
    render(<Header getCode={() => undefined} />);

    await user.click(screen.getByRole("button", { name: "Deploy" }));

    expect(navigate).not.toHaveBeenCalled();
    expect(createMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it("still saves a document the author has genuinely emptied", async () => {
    const user = userEvent.setup();
    render(<Header getCode={() => ""} />);

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    // The guard against over-correcting: an empty string is a real answer from
    // a ready editor, and deleting everything is something an author may do.
    expect(createMutation.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ code: "" }),
    );
  });
});

describe("reporting", () => {
  it("writes the failure to the dock when a save fails", async () => {
    const user = userEvent.setup();
    createMutation.mutateAsync.mockRejectedValue(new Error("node unreachable"));

    // The save handler logs and then RETHROWS. In the app that rejection
    // reaches nothing -- Button invokes onClick with `void` -- so the user's
    // only signal is the dock entry asserted below. That is what this checks.
    renderHeader();
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    // The dock is the only place this is reported; there is no toast system.
    expect(appendLog).toHaveBeenCalledWith(
      expect.stringContaining("node unreachable"),
      "error",
    );
  });

  it("does not navigate to deploy when the pre-deploy save fails", async () => {
    const user = userEvent.setup();
    createMutation.mutateAsync.mockRejectedValue(new Error("node unreachable"));
    renderHeader();

    await user.click(screen.getByRole("button", { name: "Deploy" }));

    // Reaching the deploy page with nothing saved would offer to deploy a
    // version that does not exist.
    expect(navigate).not.toHaveBeenCalled();
    expect(appendLog).toHaveBeenCalledWith(
      expect.stringContaining("Pre-deploy save failed"),
      "error",
    );
  });

  it("saves first, then goes to the deploy page", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: "Deploy" }));

    expect(createMutation.mutateAsync).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/agent/deploy");
  });
});

describe("while a save is in flight", () => {
  it("disables both actions", () => {
    saveMutation.isPending = true;
    renderHeader();

    // Double-submitting a create is how a user ends up with two agents from
    // one impatient click.
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Processing..." }),
    ).toBeDisabled();
  });
});
