import { agentNodeStatus } from "@/lib/components/GraphEditor/nodes/agentNodeStatus";

// A team's graph pins a concrete `agentVersion` -- deliberately, because the graph is
// append-only on chain and must keep compiling to the same thing. Two consequences
// were invisible: editing an agent left every team still compiling the old code, and
// deleting one left every team using it undeployable. The node draws identically in
// both cases, because the graph carries the agent's *name*, so the only signal was a
// deploy failure in another process naming an id the author never sees.
//
// These are the states that must be distinguishable. The hardest one is the last:
// "not loaded yet" must not be reported as "missing", or a slow read would flag every
// node in the editor and teach the author to ignore the marking.

const AGENTS = [
  { id: "agent-a", version: "v2" },
  { id: "agent-b", version: "v1" },
];

const node = (id: string, version: string) => ({
  agentId: id,
  agentName: "Refine",
  agentVersion: version,
  type: "agent",
});

describe("agentNodeStatus", () => {
  it("reports an agent pinned at its current version as current", () => {
    expect(agentNodeStatus(node("agent-a", "v2"), AGENTS)).toBe("current");
  });

  it("reports an agent edited since the team was built as stale", () => {
    // The team still deploys and still works -- it simply keeps compiling the older
    // code. "I fixed my agent and re-deployed and nothing changed" had no signal.
    expect(agentNodeStatus(node("agent-a", "v1"), AGENTS)).toBe("stale");
  });

  it("reports a deleted agent as missing", () => {
    // The failure this exists to surface: the node is well formed and only its
    // referent is gone, so unlike a dangling edge there is nothing to repair by
    // opening and saving.
    expect(agentNodeStatus(node("agent-gone", "v1"), AGENTS)).toBe("missing");
  });

  it("says nothing about a node that is not an agent", () => {
    // Input, output and the model nodes carry no agent, and must never be marked.
    expect(agentNodeStatus({ type: "input-node" }, AGENTS)).toBeUndefined();
  });

  it("says nothing when the agent list has not loaded", () => {
    // The distinction that keeps the marking meaningful: absence of data is not
    // evidence of a missing agent. Reporting it as "missing" would mark every node
    // on every slow read.
    expect(agentNodeStatus(node("agent-a", "v2"), undefined)).toBeUndefined();
  });

  it("says nothing when the list has loaded and is empty but the node is not an agent", () => {
    // Guards the two `undefined` reasons against being collapsed into one: an empty
    // list is a loaded list, and a non-agent node is still unmarked against it.
    expect(agentNodeStatus({ type: "output-node" }, [])).toBeUndefined();
  });

  it("reports missing when the list has loaded and is genuinely empty", () => {
    // The other side of the same line: an empty *loaded* list does mean the agent is
    // gone, and must not be confused with "not loaded".
    expect(agentNodeStatus(node("agent-a", "v2"), [])).toBe("missing");
  });

  it("ignores a node whose pinned version is not a string", () => {
    // Graphs are decoded from chain-held text; a malformed one must not be reported
    // as a missing agent, which would send the author looking for the wrong problem.
    expect(
      agentNodeStatus({ agentId: "agent-a", agentVersion: 2 }, AGENTS),
    ).toBeUndefined();
  });
});
