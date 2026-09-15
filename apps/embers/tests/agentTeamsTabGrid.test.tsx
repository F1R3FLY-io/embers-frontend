import type { AgentsTeamHeader } from "@f1r3fly-io/embers-client-sdk";

import { renderToStaticMarkup } from "react-dom/server";

const navigate = jest.fn();

let teams: AgentsTeamHeader[] = [];

jest.mock("@/lib/queries", () => ({
  useAgentsTeams: () => ({ data: { agentsTeams: teams } }),
  useDeleteAgentsTeamMutation: () => ({ mutateAsync: jest.fn() }),
  useTeamPublicationReader: () => jest.fn(),
  useUnpublishAgentsTeamMutation: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock("@/lib/providers/loader/useCallbackWithLoader", () => ({
  useCallbackWithLoader: (fn: unknown) => fn,
}));
jest.mock("@/lib/providers/loader/useMutationResultWithLoader", () => ({
  useMutationResultWithLoader: (mutation: unknown) => mutation,
}));
jest.mock("@/lib/providers/modal/useConfirm", () => ({
  useAlert: () => jest.fn(),
  useConfirm: () => jest.fn(),
}));
jest.mock("react-router-dom", () => ({ useNavigate: () => navigate }));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

type GridEntry = { id: string; name: string; type: "draft" | "normal" };
type GridProps = {
  data: GridEntry[];
  onNavigate: (id: string) => void;
  onPublish: (id: string) => void;
};
const captured: { props: GridProps | null } = { props: null };
jest.mock("@/pages/Dashboard/components/Grid", () => ({
  Grid: (props: GridProps) => {
    captured.props = props;
    return null;
  },
}));

import AgentTeamsTab from "@/pages/Dashboard/components/AgentTeamsTab/AgentTeamsTab";

// What the teams tab shows, in what order, and where its actions lead.
//
// The delete flow is covered by deleteTeamFlowOrder.test.tsx; this is the rest
// of the component, which had no coverage at all. Filtering and ordering are
// worth pinning because they are the difference between "my team is gone" and
// "my team is on the second row".

function header(overrides: Partial<AgentsTeamHeader> = {}): AgentsTeamHeader {
  return {
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    id: "team-1",
    name: "Research Desk",
    shard: "root",
    version: "v1",
    ...overrides,
  } as AgentsTeamHeader;
}

/** The props the grid was last rendered with, or null if it never was. */
function capturedProps(): GridProps | null {
  return captured.props;
}

function renderTab(
  searchQuery = "",
  sortBy: "date" | "name" = "date",
): GridProps {
  captured.props = null;
  renderToStaticMarkup(
    <AgentTeamsTab searchQuery={searchQuery} sortBy={sortBy} />,
  );
  // Read through a function so the compiler keeps the declared union: it
  // cannot see that rendering assigns through the mock, and reading the field
  // directly narrows it to `null` -- taking everything downstream to `never`.
  const props = capturedProps();
  if (props === null) {
    throw new Error("the grid never rendered");
  }
  return props;
}

beforeEach(() => {
  jest.clearAllMocks();
  teams = [
    header({
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      id: "team-a",
      name: "Zebra Desk",
    }),
    header({
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
      id: "team-b",
      name: "Alpha Desk",
      shard: "shard-two",
    }),
  ];
});

describe("filtering", () => {
  it("shows every team when the query is empty", () => {
    expect(renderTab().data).toHaveLength(2);
  });

  it("matches on name regardless of case", () => {
    expect(renderTab("alpha").data.map((entry) => entry.id)).toEqual([
      "team-b",
    ]);
  });

  it("matches on id, shard, and version as well as name", () => {
    // A user who cannot remember a team's name can still find it by anything
    // the card shows.
    expect(renderTab("team-a").data.map((entry) => entry.id)).toEqual([
      "team-a",
    ]);
    expect(renderTab("shard-two").data.map((entry) => entry.id)).toEqual([
      "team-b",
    ]);
    expect(renderTab("v1").data).toHaveLength(2);
  });

  it("ignores surrounding whitespace in the query", () => {
    // Typed queries pick up stray spaces, and a query that matches nothing
    // because of one is indistinguishable from a team that is missing.
    expect(renderTab("  alpha  ").data.map((entry) => entry.id)).toEqual([
      "team-b",
    ]);
  });

  it("shows nothing when the query matches nothing", () => {
    expect(renderTab("nothing-matches-this").data).toEqual([]);
  });
});

describe("ordering", () => {
  it("puts the newest team first by default", () => {
    expect(renderTab("", "date").data.map((entry) => entry.id)).toEqual([
      "team-b",
      "team-a",
    ]);
  });

  it("orders by name case-insensitively when asked", () => {
    expect(renderTab("", "name").data.map((entry) => entry.id)).toEqual([
      "team-b",
      "team-a",
    ]);
  });

  it("does not reorder the underlying list", () => {
    renderTab("", "name");
    // The sort copies rather than sorting the query cache in place; mutating
    // cached data would reorder it for every other consumer.
    expect(teams.map((team) => team.id)).toEqual(["team-a", "team-b"]);
  });
});

describe("deployment state", () => {
  it("marks a team that has never been deployed as a draft", () => {
    expect(renderTab().data.every((entry) => entry.type === "draft")).toBe(
      true,
    );
  });

  it("marks a deployed team as normal", () => {
    teams = [header({ lastDeploy: new Date("2026-03-01T00:00:00.000Z") })];
    expect(renderTab().data[0].type).toBe("normal");
  });
});

describe("navigation", () => {
  it("opens a team at its latest version", () => {
    renderTab().onNavigate("team-a");

    // "latest" rather than the version the list happened to hold: the editor
    // should open what is current, not what the dashboard last read.
    expect(navigate).toHaveBeenCalledWith("/agents-team/edit", {
      state: { id: "team-a", version: "latest" },
    });
  });

  it("sends publishing to the publish page for the same team", () => {
    renderTab().onPublish("team-b");

    expect(navigate).toHaveBeenCalledWith("/agents-team/publish", {
      state: { id: "team-b", version: "latest" },
    });
  });
});
