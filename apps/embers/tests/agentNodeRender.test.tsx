import { renderToStaticMarkup } from "react-dom/server";

import { NodeTemplate } from "@/lib/components/GraphEditor/nodes/NodeTemplate";

// Renders a real agent node. `agentNodeStatus` decides *what* is wrong; this covers
// that the decision reaches the canvas at all -- the failure being closed here is a
// node that looks perfectly ordinary while the agent it names has been edited or
// deleted, so a correct classification nobody can see would be the same defect.

// Must be prefixed `mock` to be visible inside a hoisted jest.mock factory.
let mockAgents: { id: string; version: string }[] | undefined = [];

jest.mock("@/lib/queries", () => ({
  useAgents: () => ({
    data: mockAgents === undefined ? undefined : { agents: mockAgents },
  }),
}));

jest.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: { Left: "left", Right: "right" },
}));

const AgentNode = NodeTemplate({
  className: "service",
  displayName: "Agent",
  icon: null,
  labelKey: "agentName",
  title: "Agent",
});

const render = (
  data: Record<string, unknown>,
  agents: { id: string; version: string }[] | undefined,
) => {
  mockAgents = agents;
  return renderToStaticMarkup(
    // `NodeProps` carries far more than a node needs here; the template reads only
    // `data` and `selected`.
    <AgentNode
      {...({ data, selected: false } as unknown as Parameters<
        typeof AgentNode
      >[0])}
    />,
  );
};

const CURRENT = [{ id: "agent-a", version: "v2" }];
const pinned = (version: string) => ({
  agentId: "agent-a",
  agentName: "Refine",
  agentVersion: version,
});

describe("agent node marking", () => {
  it("marks a node whose agent no longer exists", () => {
    const markup = render(pinned("v2"), []);

    expect(markup).toContain("agent-missing");
    expect(markup).toContain("missing");
  });

  it("marks a node pinned to a superseded version", () => {
    const markup = render(pinned("v1"), CURRENT);

    expect(markup).toContain("agent-stale");
    expect(markup).toContain("outdated");
  });

  it("leaves a node pinned to the current version unmarked", () => {
    // The marking is only worth reading if an unmarked node means something. If
    // `current` were drawn like `stale`, every node would carry a badge and none
    // would carry information.
    const markup = render(pinned("v2"), CURRENT);

    expect(markup).not.toContain("agent-stale");
    expect(markup).not.toContain("agent-missing");
    expect(markup).not.toContain("outdated");
  });

  it("leaves every node unmarked while the agent list is still loading", () => {
    // Absence of data is not evidence of a deleted agent. Marking here would flag
    // the whole graph on any slow read.
    const markup = render(pinned("v2"), undefined);

    expect(markup).not.toContain("agent-missing");
    expect(markup).not.toContain("agent-stale");
  });

  it("still shows the agent's name when it is marked", () => {
    // The marking must add to the node, not replace it: the name is how the author
    // knows which agent to restore or re-pin.
    expect(render(pinned("v2"), [])).toContain("Refine");
  });

  it("explains the marking rather than only colouring it", () => {
    // Colour alone is not a signal every author can read, and the two states differ
    // in what has to be done about them.
    expect(render(pinned("v2"), [])).toContain("cannot be deployed");
    expect(render(pinned("v1"), CURRENT)).toContain("still compiles");
  });

  it("does not mark nodes that carry no agent", () => {
    const InputNode = NodeTemplate({
      className: "source",
      displayName: "Input",
      icon: null,
      title: "Input",
    });

    mockAgents = [];
    const markup = renderToStaticMarkup(
      <InputNode
        {...({ data: {}, selected: false } as unknown as Parameters<
          typeof InputNode
        >[0])}
      />,
    );

    expect(markup).toContain("Input");
    expect(markup).not.toContain("agent-missing");
    expect(markup).not.toContain("agent-stale");
  });
});
