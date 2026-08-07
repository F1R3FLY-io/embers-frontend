/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Edge, Node } from "@/lib/components/GraphEditor/nodes";
import type { CurrentAgentsTeam } from "@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam";

const navigate = jest.fn();
const appendLog = jest.fn();
const update = jest.fn();

let agentsTeam: CurrentAgentsTeam = {};

const createMutation = { mutateAsync: jest.fn() };
const saveMutation = { mutateAsync: jest.fn() };
let saveMutationTeamId: string | undefined;

jest.mock("@/lib/queries", () => ({
  useCreateAgentsTeamMutation: () => createMutation,
  useRunAgentsTeamMutation: () => ({ mutateAsync: jest.fn() }),
  useSaveAgentsTeamMutation: (id: string) => {
    saveMutationTeamId = id;
    return saveMutation;
  },
  useTeamPublishedState: () => ({ data: undefined }),
}));

jest.mock("@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam", () => ({
  useCurrentAgentsTeam: () => ({ agentsTeam, update }),
}));

jest.mock("@/lib/providers/dock/useDock", () => ({
  useDock: () => ({ appendDeploy: jest.fn(), appendLog }),
}));

jest.mock("@/lib/providers/modal/useModal", () => ({
  useModal: () => ({ close: jest.fn(), open: jest.fn() }),
}));

// The real wrappers show the spinner, await, and hide it in a `finally`. What
// is stood in for here is the pass-through alone -- loader visibility has its
// own suite -- with rejections absorbed, which is where they actually go: the
// button invokes its handler with `void`, so nothing downstream handles them.
jest.mock("@/lib/providers/loader/useCallbackWithLoader", () => ({
  useCallbackWithLoader:
    (fn: (...args: unknown[]) => Promise<unknown>) =>
    async (...args: unknown[]) => {
      try {
        return await fn(...args);
      } catch {
        return undefined;
      }
    },
}));

jest.mock("@/lib/providers/loader/useMutationResultWithLoader", () => ({
  useMutationResultWithLoader: <T,>(mutation: T) => mutation,
}));

jest.mock("react-router-dom", () => ({ useNavigate: () => navigate }));

// Controls are addressed by translation key rather than by English copy, as
// the rest of the suite does: what is under test is which action a control
// performs, and rewording a label should not fail a test about behaviour.
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ i18n: { language: "en" }, t: (key: string) => key }),
}));

const SAVE_BUTTON = "deploy.saveAsDraft";
const DEPLOY_BUTTON = "deploy.deploy";

import { Header } from "@/lib/layouts/Graph/Header";

/**
 * Saving a team from the graph editor.
 *
 * Deliberately NOT mocking `@/lib/workflow`: the projection from canvas to
 * definition is where this flow has failed, so replacing it would leave the
 * test asserting that a button calls a function -- which was never in doubt.
 */

function node(id: string, type: Node["type"]): Node {
  return { data: {}, id, position: { x: 0, y: 0 }, type } as Node;
}

function edge(source: string, target: string): Edge {
  return { data: {}, id: `${source}-${target}`, source, target };
}

beforeEach(() => {
  jest.clearAllMocks();
  agentsTeam = {
    name: "Research Desk",
    nodes: [node("in", "input-node"), node("out", "output-node")],
  };
  createMutation.mutateAsync.mockResolvedValue({
    prepareResponse: { response: { id: "team-new", version: "version-1" } },
    waitForFinalization: Promise.resolve(),
  });
  saveMutation.mutateAsync.mockResolvedValue({
    prepareResponse: { response: { version: "version-2" } },
    waitForFinalization: Promise.resolve(),
  });
});

describe("a team with nodes but no edges", () => {
  // The state every new team passes through: the author drops one node and
  // saves. `edges` is never assigned until an edge is drawn, so it is
  // genuinely `undefined` here -- not a contrived input.
  it("is saved rather than failing before the request is sent", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("button", { name: SAVE_BUTTON }));

    expect(createMutation.mutateAsync).toHaveBeenCalledTimes(1);
    // Named explicitly: the failure this guards was a TypeError raised inside
    // the projection, reported into the dock as an internal message with
    // nothing saved and no dialog shown.
    expect(appendLog).not.toHaveBeenCalledWith(
      expect.stringContaining("Save failed"),
      "error",
    );
  });

  it("sends an empty edge list rather than a missing one", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("button", { name: SAVE_BUTTON }));

    const [payload] = createMutation.mutateAsync.mock.calls[0] as [
      { edges: Edge[]; nodes: Node[] },
    ];
    expect(payload.edges).toEqual([]);
    expect(payload.nodes).toHaveLength(2);
  });

  it("records the id the server minted", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("button", { name: SAVE_BUTTON }));

    // Without carrying the id back the editor still looks like a new team, and
    // the next save creates a SECOND one rather than a version of this one.
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ id: "team-new", version: "version-1" }),
    );
  });
});

describe("a team with no canvas at all", () => {
  it("is still saved, as the empty draft it is", async () => {
    const user = userEvent.setup();
    agentsTeam = { name: "Research Desk" };
    render(<Header />);

    await user.click(screen.getByRole("button", { name: SAVE_BUTTON }));

    expect(createMutation.mutateAsync).toHaveBeenCalledTimes(1);
    const [payload] = createMutation.mutateAsync.mock.calls[0] as [
      { edges: Edge[]; nodes: Node[] },
    ];
    expect(payload.nodes).toEqual([]);
    expect(payload.edges).toEqual([]);
  });
});

describe("an existing team", () => {
  beforeEach(() => {
    agentsTeam = {
      edges: [edge("in", "out")],
      id: "team-1",
      name: "Research Desk",
      nodes: [node("in", "input-node"), node("out", "output-node")],
    };
  });

  it("adds a version rather than creating another team", async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole("button", { name: SAVE_BUTTON }));

    expect(saveMutation.mutateAsync).toHaveBeenCalledTimes(1);
    expect(createMutation.mutateAsync).not.toHaveBeenCalled();
    expect(saveMutationTeamId).toBe("team-1");
  });
});

describe("deploying", () => {
  it("refuses a canvas that cannot be published, and says why", async () => {
    const user = userEvent.setup();
    // A lone node with no input is not a publishable workflow. The editor is
    // permissive and the validator strict, which is the documented split
    // between saving a draft and deploying it.
    agentsTeam = { name: "Research Desk", nodes: [node("mid", "compress")] };
    render(<Header />);

    await user.click(screen.getByRole("button", { name: DEPLOY_BUTTON }));

    expect(navigate).not.toHaveBeenCalled();
    expect(appendLog).toHaveBeenCalledWith(
      expect.stringContaining("Pre-deploy save failed"),
      "error",
    );
  });

  it("saves first, then goes to the deploy page", async () => {
    const user = userEvent.setup();
    agentsTeam = {
      edges: [edge("in", "out")],
      name: "Research Desk",
      nodes: [node("in", "input-node"), node("out", "output-node")],
    };
    render(<Header />);

    await user.click(screen.getByRole("button", { name: DEPLOY_BUTTON }));

    // Reaching the deploy page with nothing saved would offer to deploy a
    // version that does not exist.
    expect(createMutation.mutateAsync).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith("/agents-team/deploy");
  });
});
