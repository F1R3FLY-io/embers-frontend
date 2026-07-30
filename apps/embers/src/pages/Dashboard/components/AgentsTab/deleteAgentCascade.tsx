import type { ReferencingTeam } from "@/lib/publishedState";
import type { TeamRemoval } from "@/lib/teams/removeTeam";

import { removeTeam, TEAM_REMOVAL_ORDER } from "@/lib/teams/removeTeam";

/**
 * What deleting an agent is about to cost.
 *
 * Deleting an agent a team uses leaves that team permanently undeployable, and
 * nothing shows it: the team's graph carries the agent's name, so the editor keeps
 * drawing the node, and the failure appears only at deploy. Unlike a dangling edge
 * there is no repair -- the node is well formed and only its referent is gone. So the
 * teams go with the agent, and the dialog says exactly which.
 *
 * Published teams get a line of their own because deleting a team does **not**
 * unpublish it: a team is run by registry uri, and the deployed contract is reached
 * directly rather than through the wallet's team index that deletion removes it from.
 * A published handle would therefore keep answering mentions for a team the user
 * believes is gone. Those are unpublished as part of the cascade.
 */
export function cascadeMessage(
  agentName: string,
  teams: ReferencingTeam[],
): React.ReactNode {
  if (teams.length === 0) {
    return `Delete the agent "${agentName}"? This cannot be undone.`;
  }

  const published = teams.filter((team) => team.published);

  return (
    <span>
      {`Delete the agent "${agentName}"?`}
      <br />
      <br />
      {teams.length === 1
        ? "1 team uses this agent and will be deleted with it:"
        : `${teams.length} teams use this agent and will be deleted with it:`}
      <br />
      {teams.map((team) => (
        <span key={team.id}>
          {`  • ${team.name}`}
          {team.published
            ? ` — published${
                team.published_handle ? ` @${team.published_handle}` : ""
              }`
            : ""}
          <br />
        </span>
      ))}
      {published.length > 0 ? (
        <>
          <br />
          {published.length === 1
            ? "That published team will stop responding to mentions. Its account is kept, so it can be published again later."
            : "Those published teams will stop responding to mentions. Their accounts are kept, so they can be published again later."}
        </>
      ) : null}
      <br />
      <br />
      This cannot be undone.
    </span>
  );
}

/**
 * The order the cascade must run in.
 *
 * Every referencing team is removed, each stopped from answering mentions before it
 * goes, and only then the agent. Deleting the agent last is what makes an interrupted
 * cascade safe: it never leaves a surviving team pointing at an agent that no longer
 * exists, which is the unrepairable state this whole change exists to prevent.
 *
 * Pairing unpublish with delete per team, rather than unpublishing all of them first,
 * keeps every interruption at a team boundary: the teams already handled are fully
 * gone and the rest are untouched, instead of several being left unpublished but
 * present.
 */
export const CASCADE_ORDER = [...TEAM_REMOVAL_ORDER, "agent"] as const;

export interface CascadeActions extends TeamRemoval {
  deleteAgent: (agentId: string) => Promise<unknown>;
}

/**
 * Runs the cascade, stopping at the first failure.
 *
 * Stopping rather than continuing is the point: every later step widens the damage,
 * and the state an interrupted cascade leaves is always one the user can recover from
 * by hand -- teams that still exist, or a team that is unpublished and can be
 * published again.
 *
 * Extracted from the component so this ordering can be tested by forcing each step to
 * fail in turn. The alternative -- asserting it against a live chain -- would test it
 * once, in the one order the chain happened to take.
 */
export async function runCascade(
  agentId: string,
  teams: ReferencingTeam[],
  actions: CascadeActions,
): Promise<void> {
  for (const team of teams) {
    // Sequential deliberately. Concurrency would win a little latency and lose the
    // property the ordering exists for: with a `Promise.all` every step is already
    // in flight when the first one fails, so "stop at the first failure" becomes
    // "stop after all of them have happened".
    // eslint-disable-next-line no-await-in-loop
    await removeTeam(team.id, team.published, actions);
  }

  await actions.deleteAgent(agentId);
}
