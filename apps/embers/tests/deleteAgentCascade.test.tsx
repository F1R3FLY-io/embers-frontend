import { renderToStaticMarkup } from "react-dom/server";

import type { ReferencingTeam } from "@/lib/publishedState";

import {
  CASCADE_ORDER,
  cascadeMessage,
  runCascade,
} from "@/pages/Dashboard/components/AgentsTab/deleteAgentCascade";

// Deleting an agent a team uses leaves that team permanently undeployable, with no
// repair: the node is well formed and only its referent is gone, so opening and
// saving the team fixes nothing. The cascade is what stops that state being reachable
// at all -- but only if the dialog names what is about to be destroyed, and only if
// the steps run in an order whose every interruption leaves something recoverable.

/** Nothing in the cascade resolves synchronously; the fakes should not either. */
const TICK = Promise.resolve();

const team = (over: Partial<ReferencingTeam> = {}): ReferencingTeam => ({
  id: "team-1",
  name: "RedTeam",
  published: false,
  published_handle: null,
  version: "v1",
  ...over,
});

const message = (agentName: string, teams: ReferencingTeam[]) =>
  renderToStaticMarkup(<>{cascadeMessage(agentName, teams)}</>);

describe("cascade warning", () => {
  it("names the agent when nothing references it", () => {
    const text = message("Refine", []);

    expect(text).toContain("Refine");
    expect(text).toContain("cannot be undone");
  });

  it("does not claim teams will be deleted when none will", () => {
    // Warning about a cascade that will not happen teaches the user to dismiss the
    // dialog unread, which is how the real warning gets missed.
    expect(message("Refine", [])).not.toContain("will be deleted with it");
  });

  it("names every team that will go with the agent", () => {
    const text = message("Refine", [
      team({ id: "a", name: "RedTeam" }),
      team({ id: "b", name: "Experiment 3" }),
    ]);

    expect(text).toContain("RedTeam");
    expect(text).toContain("Experiment 3");
    expect(text).toContain("2 teams");
  });

  it("counts a single team without saying 1 teams", () => {
    const text = message("Refine", [team()]);

    expect(text).toContain("1 team uses this agent");
    expect(text).not.toContain("1 teams");
  });

  it("says which teams are published, and under which handle", () => {
    // The consequence the user cannot otherwise know: a deleted team keeps answering
    // mentions, because the deployed contract is reached by registry uri rather than
    // through the wallet's team index that deletion removes it from.
    const text = message("Refine", [
      team({ published: true, published_handle: "redteam.test" }),
    ]);

    expect(text).toContain("published");
    expect(text).toContain("@redteam.test");
    expect(text).toContain("stop responding to mentions");
  });

  it("still marks a published team whose handle was never recorded", () => {
    // Publications predating handles being stored are still live. Inferring
    // "published" from the presence of a handle would silently omit them.
    const text = message("Refine", [
      team({ published: true, published_handle: null }),
    ]);

    expect(text).toContain("published");
    expect(text).toContain("stop responding to mentions");
  });

  it("says nothing about mentions when no team is published", () => {
    expect(message("Refine", [team()])).not.toContain(
      "stop responding to mentions",
    );
  });
});

describe("cascade order", () => {
  const actions = (failing?: "agent" | "team" | "unpublish") => {
    const calls: string[] = [];
    const step =
      (name: string, fails: boolean) =>
      async (id: string): Promise<void> => {
        calls.push(`${name}:${id}`);
        // Yield first, as every real step does: each is a chain write or a PDS
        // call. An ordering that held only while the steps resolved synchronously
        // would not be the ordering the cascade actually runs.
        await TICK;
        if (fails) {
          throw new Error(`${name} refused`);
        }
      };

    return {
      calls,
      deleteAgent: step("agent", failing === "agent"),
      deleteTeam: step("delete", failing === "team"),
      unpublishTeam: step("unpublish", failing === "unpublish"),
    };
  };

  const TEAMS = [
    team({ id: "a", published: true, published_handle: "redteam.test" }),
    team({ id: "b", published: false }),
  ];

  it("stops and removes each team, then deletes the agent", () => {
    // Pinned as data as well as behaviour so a reordering has to be deliberate.
    expect([...CASCADE_ORDER]).toEqual(["unpublish", "delete", "agent"]);
  });

  it("runs every step in that order", async () => {
    const acts = actions();

    await runCascade("agent-1", TEAMS, acts);

    expect(acts.calls).toEqual([
      "unpublish:a",
      "delete:a",
      "delete:b",
      "agent:agent-1",
    ]);
  });

  it("only unpublishes the teams that are published", async () => {
    // Unpublishing an unpublished team fails, which would abort a cascade that had
    // nothing wrong with it.
    const acts = actions();

    await runCascade("agent-1", TEAMS, acts);

    expect(acts.calls.filter((call) => call.startsWith("unpublish"))).toEqual([
      "unpublish:a",
    ]);
  });

  it("removes no team when unpublishing fails", async () => {
    // The worst outcome the ordering rules out: a team gone from the dashboard while
    // its handle still answers mentions, and the credentials needed to stop it gone
    // with the team.
    const acts = actions("unpublish");

    await expect(runCascade("agent-1", TEAMS, acts)).rejects.toThrow(
      "unpublish refused",
    );
    expect(acts.calls.some((call) => call.startsWith("delete:"))).toBe(false);
    expect(acts.calls.some((call) => call.startsWith("agent:"))).toBe(false);
  });

  it("leaves the agent in place when a team deletion fails", async () => {
    // Deleting the agent anyway would produce exactly the state this whole change
    // exists to prevent: a surviving team referencing an agent that is gone.
    const acts = actions("team");

    await expect(runCascade("agent-1", TEAMS, acts)).rejects.toThrow(
      "delete refused",
    );
    expect(acts.calls.some((call) => call.startsWith("agent:"))).toBe(false);
  });

  it("propagates a failed agent deletion after the teams are gone", async () => {
    // The one irrecoverable-looking case, and it is not: the teams referenced an
    // agent the user chose to delete, so their loss is what was confirmed. The
    // rejection is what stops the caller reporting success.
    const acts = actions("agent");

    await expect(runCascade("agent-1", TEAMS, acts)).rejects.toThrow(
      "agent refused",
    );
    expect(acts.calls).toEqual([
      "unpublish:a",
      "delete:a",
      "delete:b",
      "agent:agent-1",
    ]);
  });

  it("deletes the agent directly when no team references it", async () => {
    const acts = actions();

    await runCascade("agent-1", [], acts);

    expect(acts.calls).toEqual(["agent:agent-1"]);
  });
});
