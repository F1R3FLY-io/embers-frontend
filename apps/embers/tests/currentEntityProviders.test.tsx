/**
 * @jest-environment jsdom
 */
import type { PropsWithChildren } from "react";

import { act, renderHook } from "@testing-library/react";

let agentData: Record<string, unknown> | undefined;
let teamData: Record<string, unknown> | undefined;
let locationState: Record<string, unknown> | null = null;

jest.mock("@/lib/queries", () => ({
  useAgent: () => ({ data: agentData }),
  useAgentsTeam: () => ({ data: teamData }),
}));

jest.mock("react-router-dom", () => ({
  useLocation: () => ({ state: locationState }),
}));

import { CurrentAgentProvider } from "@/lib/providers/currentAgent/CurrentAgentProvider";
import { useCurrentAgent } from "@/lib/providers/currentAgent/useCurrentAgent";
import { CurrentAgentsTeamProvider } from "@/lib/providers/currentAgentsTeam/CurrentAgentsTeamProvider";
import { useCurrentAgentsTeam } from "@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam";

// The two providers that hold "the thing currently being edited", and the way
// they DISAGREE about when to accept fresh data from the server.
//
// They are otherwise the same component written twice. The difference is one
// dependency array:
//
//   CurrentAgentProvider      useEffect(..., [data])
//   CurrentAgentsTeamProvider useEffect(..., [data?.id, data?.version])
//
// The agent version carries a comment explaining that keying on id and version
// alone would skip a restore, because navigating back re-seeds from the route
// (which carries no code). The team version does exactly that, behind an
// eslint-disable justified as "agents teams are append only".
//
// These tests pin both behaviors rather than assuming either is right. The
// divergence is currently invisible: it lives in a disabled lint rule, and
// nothing anywhere states what the two providers actually do differently. If
// the team provider is ever meant to match the agent one, the failing test
// here is the specification.

beforeEach(() => {
  agentData = undefined;
  teamData = undefined;
  locationState = null;
});

function agentWrapper({ children }: PropsWithChildren) {
  return <CurrentAgentProvider>{children}</CurrentAgentProvider>;
}

function teamWrapper({ children }: PropsWithChildren) {
  return <CurrentAgentsTeamProvider>{children}</CurrentAgentsTeamProvider>;
}

describe("shared behavior", () => {
  it("seeds the agent from the route it was opened with", () => {
    locationState = { id: "agent-1", version: "latest" };

    const { result } = renderHook(() => useCurrentAgent(), {
      wrapper: agentWrapper,
    });

    // Identity travels through the router rather than the URL, so this is the
    // only thing that tells the editor which agent it is editing.
    expect(result.current.agent).toMatchObject({ id: "agent-1" });
  });

  it("seeds the team from the route it was opened with", () => {
    locationState = { id: "team-1", version: "latest" };

    const { result } = renderHook(() => useCurrentAgentsTeam(), {
      wrapper: teamWrapper,
    });

    expect(result.current.agentsTeam).toMatchObject({ id: "team-1" });
  });

  it("merges an update into the agent rather than replacing it", () => {
    locationState = { id: "agent-1", version: "latest" };

    const { result } = renderHook(() => useCurrentAgent(), {
      wrapper: agentWrapper,
    });

    act(() => {
      result.current.update({ name: "Researcher" });
    });

    // A replacing update would drop the id and leave the editor unable to say
    // what it is saving.
    expect(result.current.agent).toMatchObject({
      id: "agent-1",
      name: "Researcher",
    });
  });

  it("clears the team on reset", () => {
    locationState = { id: "team-1", version: "latest" };

    const { result } = renderHook(() => useCurrentAgentsTeam(), {
      wrapper: teamWrapper,
    });

    act(() => {
      result.current.update({ name: "Research Desk" });
      result.current.reset();
    });

    // "Create another" depends on this: a leftover id would turn the next
    // create into a save of the previous team.
    expect(result.current.agentsTeam).toEqual({});
  });

  it("adopts loaded agent data", () => {
    agentData = { code: "new x in { Nil }", id: "agent-1", version: "v1" };

    const { result } = renderHook(() => useCurrentAgent(), {
      wrapper: agentWrapper,
    });

    expect(result.current.agent).toMatchObject({ code: "new x in { Nil }" });
  });

  it("adopts loaded team data", () => {
    teamData = { definition: { nodes: {} }, id: "team-1", version: "v1" };

    const { result } = renderHook(() => useCurrentAgentsTeam(), {
      wrapper: teamWrapper,
    });

    expect(result.current.agentsTeam).toMatchObject({
      definition: { nodes: {} },
    });
  });
});

describe("when the server returns different CONTENT for the same version", () => {
  it("the agent provider adopts it", () => {
    agentData = { code: "first", id: "agent-1", version: "v1" };

    const { rerender, result } = renderHook(() => useCurrentAgent(), {
      wrapper: agentWrapper,
    });
    expect(result.current.agent).toMatchObject({ code: "first" });

    // Same id and version, new content -- a refetch that returned a corrected
    // record, for instance.
    agentData = { code: "second", id: "agent-1", version: "v1" };
    rerender();

    // Keyed on `data` itself, so the change is picked up. The comment in that
    // provider explains why: re-seeding from the route drops the code, and
    // only a data-keyed effect restores it.
    expect(result.current.agent).toMatchObject({ code: "second" });
  });

  it("the team provider IGNORES it", () => {
    teamData = {
      definition: { nodes: { a: {} } },
      id: "team-1",
      version: "v1",
    };

    const { rerender, result } = renderHook(() => useCurrentAgentsTeam(), {
      wrapper: teamWrapper,
    });
    expect(result.current.agentsTeam).toMatchObject({
      definition: { nodes: { a: {} } },
    });

    teamData = {
      definition: { nodes: { b: {} } },
      id: "team-1",
      version: "v1",
    };
    rerender();

    // PINNED, NOT ENDORSED. Keyed on id and version alone, so identical
    // identity means the effect never re-runs and the newer definition is
    // discarded. The justification given is that teams are append-only, which
    // holds only while every content change also mints a new version -- true
    // of saves, and the assumption this rests on.
    expect(result.current.agentsTeam).toMatchObject({
      definition: { nodes: { a: {} } },
    });
  });

  it("the team provider adopts it once the version changes", () => {
    teamData = {
      definition: { nodes: { a: {} } },
      id: "team-1",
      version: "v1",
    };

    const { rerender, result } = renderHook(() => useCurrentAgentsTeam(), {
      wrapper: teamWrapper,
    });

    teamData = {
      definition: { nodes: { b: {} } },
      id: "team-1",
      version: "v2",
    };
    rerender();

    // The complement of the above, and what makes the append-only assumption
    // survivable in practice: a save mints a version, and that is what the
    // provider watches for.
    expect(result.current.agentsTeam).toMatchObject({
      definition: { nodes: { b: {} } },
    });
  });
});
