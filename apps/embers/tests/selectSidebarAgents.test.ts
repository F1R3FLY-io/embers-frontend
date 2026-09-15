import { selectSidebarAgents } from "@/lib/layouts/Graph/selectSidebarAgents";

// Nine, deliberately more than the six that used to fit the sidebar's old height
// cap, and not a number the implementation may branch on.
const NAMES = [
  "Refine",
  "Cavify",
  "Condense",
  "EvidenceCritic",
  "Hypothesize",
  "FeasibilityCritic",
  "LogicCritic",
  "Summarize",
  "arrange",
];

const agents = NAMES.map((name, index) => ({
  id: `id-${index}`,
  name,
  version: `v-${index}`,
}));

describe("selectSidebarAgents", () => {
  it("offers every agent when there is no search query", () => {
    // The regression this guards: a `slice`/`take` here would look to the user
    // exactly like the CSS clipping bug it was mistaken for.
    expect(selectSidebarAgents(agents, "")).toHaveLength(agents.length);
  });

  it("keeps offering every agent as the list grows", () => {
    // Length-independence is the actual requirement, so assert it across sizes
    // rather than pinning one count.
    for (let size = 0; size <= agents.length; size++) {
      expect(selectSidebarAgents(agents.slice(0, size), "")).toHaveLength(size);
    }
  });

  it("loses no agent to whitespace-only queries", () => {
    expect(selectSidebarAgents(agents, "   ")).toHaveLength(agents.length);
  });

  it("orders by name, case-insensitively", () => {
    const ordered = selectSidebarAgents(agents, "").map((agent) => agent.name);

    // `arrange` sorts among the capitals rather than after them, which a
    // case-sensitive comparison would get wrong.
    expect(ordered).toEqual([
      "arrange",
      "Cavify",
      "Condense",
      "EvidenceCritic",
      "FeasibilityCritic",
      "Hypothesize",
      "LogicCritic",
      "Refine",
      "Summarize",
    ]);
  });

  it("returns every match for a query, not just the first", () => {
    const matched = selectSidebarAgents(agents, "critic").map((a) => a.name);

    expect(matched).toEqual([
      "EvidenceCritic",
      "FeasibilityCritic",
      "LogicCritic",
    ]);
  });

  it("matches case-insensitively and on substrings anywhere in the name", () => {
    expect(selectSidebarAgents(agents, "CRITIC")).toHaveLength(3);
    expect(selectSidebarAgents(agents, "ypothes").map((a) => a.name)).toEqual([
      "Hypothesize",
    ]);
  });

  it("returns nothing when a query matches nothing", () => {
    expect(selectSidebarAgents(agents, "nosuchagent")).toEqual([]);
  });

  it("preserves each agent's identity, which names its key downstream", () => {
    // The sidebar passes id and version into the node's data; a team graph pins
    // the concrete version, so dropping either would break compilation.
    const refine = selectSidebarAgents(agents, "Refine")[0];

    expect(refine).toEqual({
      id: `id-${NAMES.indexOf("Refine")}`,
      name: "Refine",
      version: `v-${NAMES.indexOf("Refine")}`,
    });
  });

  it("does not mutate the array it is given", () => {
    // It sorts, and sort is in-place -- so the filter must come first, as it
    // does. Guards a refactor that reorders them.
    const original = [...agents];
    selectSidebarAgents(agents, "");

    expect(agents).toEqual(original);
  });
});
