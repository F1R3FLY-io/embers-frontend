/**
 * Removing a team without leaving it answering mentions.
 *
 * Deleting a team removes its entry from the wallet's team index and nothing else.
 * `run.rho` never consults that index: it resolves a team by registry uri and calls
 * the deployed contract directly, so a published team that has been deleted keeps
 * replying to `@mentions` indefinitely, from a dashboard where it no longer appears.
 * Two systems hold one fact, and deletion only ever reached one of them.
 *
 * This is the one place that reaches both, so the two delete paths -- a team removed
 * directly, and a team removed because the agent it uses is being deleted -- cannot
 * disagree about what "deleted" means.
 */
import type { PublishedState } from "@/lib/publishedState";

/**
 * Whether removing this team has to stop a publication first.
 *
 * `null` means nothing was ever published. `active: false` means the record that
 * makes f1r3sky treat the handle as a team is already gone, and unpublishing again
 * would fail -- aborting a removal that had nothing wrong with it.
 *
 * `active: null` -- the PDS could not be asked -- counts as published. The costs are
 * not symmetric: attempting an unnecessary unpublish fails loudly and stops the
 * deletion, while skipping a necessary one leaves a handle answering mentions for a
 * team that no longer exists, with the credentials to stop it gone along with it.
 */
export function needsUnpublishing(
  publication: PublishedState | null,
): publication is PublishedState {
  return publication !== null && publication.active !== false;
}

export interface TeamRemoval {
  deleteTeam: (teamId: string) => Promise<unknown>;
  unpublishTeam: (teamId: string) => Promise<unknown>;
}

/** What each step of removing one team does, in the order it is done. */
export const TEAM_REMOVAL_ORDER = ["unpublish", "delete"] as const;

/**
 * Stops the team answering mentions, then removes it.
 *
 * The order carries the whole guarantee. Unpublishing needs the credentials the
 * publication was made with, which are reached through the team; delete first and a
 * failed unpublish leaves a handle replying for a team that no longer exists, with
 * nothing left to stop it through. Unpublish first and the worst interruption leaves
 * a team that is merely unpublished -- visible, intact, and republishable.
 *
 * `published` is passed in rather than read here so the caller can put the same fact
 * in front of the user before they confirm. A team that is not published skips
 * straight to deletion: unpublishing one that never was fails, which would abort a
 * removal that had nothing wrong with it.
 */
export async function removeTeam(
  teamId: string,
  published: boolean,
  actions: TeamRemoval,
): Promise<void> {
  if (published) {
    await actions.unpublishTeam(teamId);
  }

  await actions.deleteTeam(teamId);
}
