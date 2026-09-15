import type { PublishedState } from "@/lib/publishedState";

import { needsUnpublishing, removeTeam } from "@/lib/teams/removeTeam";
import { deleteTeamMessage } from "@/pages/Dashboard/components/AgentTeamsTab/deleteTeamMessage";

// Deleting a team removed it from the wallet's index and nothing else. `run.rho`
// resolves a team by registry uri and calls its deployed contract directly, never
// consulting that index, so a published team carried on answering `@mentions`
// indefinitely from a dashboard where it no longer appeared. Two systems held one
// fact, and deletion reached only one of them.
//
// The dashboard's own delete button had no protection at all -- the agent cascade
// covered the case where a team went because its agent did, and left the far more
// ordinary case untouched.

/** Nothing here resolves synchronously; the fakes should not either. */
const TICK = Promise.resolve();

const publication = (over: Partial<PublishedState> = {}): PublishedState => ({
  account_exists: true,
  active: true,
  did: "did:plc:redteam",
  handle: "redteam.test",
  is_latest_deployment: true,
  published_version: "v1",
  uri: "rho:id:redteam",
  ...over,
});

describe("whether a removal has to stop a publication", () => {
  it("does when the team is published and in force", () => {
    expect(needsUnpublishing(publication())).toBe(true);
  });

  it("does not when the team was never published", () => {
    expect(needsUnpublishing(null)).toBe(false);
  });

  it("does not when the publication has already been stopped", () => {
    // Unpublishing again fails, which would abort a removal that had nothing wrong
    // with it.
    expect(needsUnpublishing(publication({ active: false }))).toBe(false);
  });

  it("does when the PDS could not be asked", () => {
    // The costs are not symmetric. An unnecessary unpublish fails loudly and stops
    // the deletion; a skipped necessary one leaves a handle answering mentions for a
    // team that no longer exists, with the credentials to stop it gone with it.
    expect(needsUnpublishing(publication({ active: null }))).toBe(true);
  });
});

describe("removing a team", () => {
  const actions = (failing?: "delete" | "unpublish") => {
    const calls: string[] = [];
    const step =
      (name: string, fails: boolean) =>
      async (id: string): Promise<void> => {
        calls.push(`${name}:${id}`);
        await TICK;
        if (fails) {
          throw new Error(`${name} refused`);
        }
      };

    return {
      calls,
      deleteTeam: step("delete", failing === "delete"),
      unpublishTeam: step("unpublish", failing === "unpublish"),
    };
  };

  it("stops the mentions before removing the team", async () => {
    const acts = actions();

    await removeTeam("team-1", true, acts);

    expect(acts.calls).toEqual(["unpublish:team-1", "delete:team-1"]);
  });

  it("does not delete the team when it could not be stopped", async () => {
    // The worst outcome the ordering rules out: a handle still replying for a team
    // that is gone, reachable only through credentials that went with it.
    const acts = actions("unpublish");

    await expect(removeTeam("team-1", true, acts)).rejects.toThrow(
      "unpublish refused",
    );
    expect(acts.calls).toEqual(["unpublish:team-1"]);
  });

  it("skips the unpublish for a team that is not published", async () => {
    const acts = actions();

    await removeTeam("team-1", false, acts);

    expect(acts.calls).toEqual(["delete:team-1"]);
  });
});

describe("the delete-team warning", () => {
  it("names the team", () => {
    expect(deleteTeamMessage("RedTeam", null)).toContain("RedTeam");
  });

  it("says nothing about mentions for a team that was never published", () => {
    expect(deleteTeamMessage("RedTeam", null)).not.toContain("mentions");
  });

  it("names the handle that will stop responding", () => {
    const text = deleteTeamMessage("RedTeam", publication());

    expect(text).toContain("@redteam.test");
    expect(text).toContain("stop responding to mentions");
  });

  it("says the account survives, because it does", () => {
    // The account and handle are kept, so this is reversible by publishing again.
    // Saying so is what stops the user hesitating over a reversible action -- or
    // assuming a destructive one was reversible.
    expect(deleteTeamMessage("RedTeam", publication())).toContain(
      "publish to it again",
    );
  });

  it("still warns when the handle was never recorded", () => {
    const text = deleteTeamMessage(
      "RedTeam",
      publication({ did: null, handle: null }),
    );

    expect(text).toContain("stop responding to mentions");
  });

  it("says nothing about mentions once the publication is already stopped", () => {
    expect(
      deleteTeamMessage("RedTeam", publication({ active: false })),
    ).not.toContain("stop responding to mentions");
  });
});
