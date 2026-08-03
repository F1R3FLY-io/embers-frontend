import { renderToStaticMarkup } from "react-dom/server";

import { Sidebar } from "@/lib/layouts/Graph/Sidebar";

// Renders the real sidebar to markup. This reaches what the pure-selector tests
// cannot: that every selected agent is actually placed in the panel, that the
// panel opts out of the fixed height cap which used to hide the seventh row, and
// that the curated list is ordered above the growing one.
//
// `renderToStaticMarkup` rather than a DOM: this package's jest runs in the node
// environment with no jsdom, and markup is enough for these facts. It cannot show
// clipping -- that needs layout, which only a browser has.

// Must be prefixed `mock` to be visible inside a hoisted jest.mock factory.
let mockAgentNames: string[] = [];

jest.mock("@/lib/queries", () => ({
  useAgents: () => ({
    data: {
      agents: mockAgentNames.map((name, index) => ({
        id: `id-${index}`,
        logo: undefined,
        name,
        version: `v-${index}`,
      })),
    },
  }),
  useAgentsTeamVersions: () => ({ data: undefined }),
}));

jest.mock("@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam", () => ({
  useCurrentAgentsTeam: () => ({
    agentsTeam: {},
    reset: () => undefined,
    update: () => undefined,
  }),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const render = (names: string[]) => {
  mockAgentNames = names;
  return renderToStaticMarkup(<Sidebar />);
};

const SEVEN = [
  "Cavify",
  "Condense",
  "EvidenceCritic",
  "FeasibilityCritic",
  "Hypothesize",
  "LogicCritic",
  "Refine",
];

describe("graph sidebar", () => {
  it("places every agent in the panel, whatever the count", () => {
    // Nine: more than the six that used to fit the old cap, and not a number the
    // component may branch on.
    const names = [...SEVEN, "Summarize", "arrange"];

    const markup = render(names);

    for (const name of names) {
      expect(markup).toContain(name);
    }
  });

  it("keeps the agent that sorts last, which was the one that vanished", () => {
    // The reported symptom exactly: seven agents, and `Refine` sorts last.
    expect(render(SEVEN)).toContain("Refine");
  });

  it("orders the curated nodes above the custom agents", () => {
    // The custom list grows without bound; the curated one is fixed. Keeping the
    // fixed list first stops new agents pushing the built-in nodes out of view.
    const markup = render(["Refine"]);

    expect(markup).toContain("All Nodes");
    expect(markup).toContain("Your Agents");
    expect(markup.indexOf("All Nodes")).toBeLessThan(
      markup.indexOf("Your Agents"),
    );
  });

  it("opts both panels out of the fixed height cap", () => {
    // `fit-content` is what removes `max-height: 300px`. Without it the panel
    // silently clips every row past the sixth, with no way to scroll to them.
    const markup = render(["Refine"]);

    expect(markup.split("fit-content").length - 1).toBe(2);
  });

  it("does not re-enable the overflow that turned clipping into a dead end", () => {
    // `overflow-hidden` overrode the `overflow: auto` that would at least have
    // allowed scrolling. It must not come back on these panels.
    expect(render(["Refine"])).not.toContain("overflow-hidden");
  });

  it("still lists the curated nodes", () => {
    // Guards the reorder against dropping a panel rather than moving it.
    const markup = render(["Refine"]);

    for (const node of ["Compress", "Input", "Output", "Text model"]) {
      expect(markup).toContain(node);
    }
  });

  it("does not offer the palette-hidden foreign-language term node", () => {
    // The FLT node is FIPS-gated and hidden from authoring; it must not appear
    // in the palette even though its registry entry still exists so existing
    // FLT nodes render.
    const markup = render(["Refine"]);

    expect(markup).toContain("Compress"); // a curated node is still listed
    expect(markup).not.toContain("Foreign-language term");
  });

  it("says so plainly when the wallet has no agents", () => {
    expect(render([])).toContain("No agents yet");
  });
});
