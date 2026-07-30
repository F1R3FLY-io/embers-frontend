import type { PublishedState } from "@/lib/publishedState";

import { needsUnpublishing } from "@/lib/teams/removeTeam";

/**
 * What deleting a team is about to cost.
 *
 * Deleting a team removes it from the wallet's index and nothing else. `run.rho`
 * resolves a team by registry uri and calls its deployed contract directly, never
 * consulting that index, so a published team keeps answering `@mentions` after it has
 * vanished from the dashboard. The deletion now stops the mentions too, and this is
 * what tells the user that is about to happen -- and to which handle, since the
 * account survives and can be published to again.
 */
export function deleteTeamMessage(
  teamName: string,
  publication: PublishedState | null,
): string {
  const plain = `Delete the team "${teamName}"? This cannot be undone.`;

  if (!needsUnpublishing(publication)) {
    return plain;
  }

  const named = publication.handle ? `@${publication.handle}` : "Its handle";

  // `active === null` reaches here too: the PDS could not be asked, so whether the
  // team is still answering is unknown. Saying it will stop is the honest reading --
  // the deletion attempts it either way -- and overstating a consequence the user is
  // being asked to confirm is the safe direction.
  return (
    `${teamName} is published, and ${named} will stop responding to mentions. ` +
    `The account is kept, so you can publish to it again later.\n\n${plain}`
  );
}
