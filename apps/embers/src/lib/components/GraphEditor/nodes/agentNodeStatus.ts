/**
 * How an agent node's pinned agent stands against the wallet's current agents.
 *
 * A team's graph pins a concrete `agentVersion`, deliberately: the graph is
 * append-only on chain and must keep compiling to the same thing. The consequence is
 * that editing an agent leaves every team still compiling the old code, and deleting
 * one leaves every team using it undeployable. Neither was visible anywhere -- the
 * node draws normally either way, because the graph carries the agent's *name* -- so
 * "I fixed my agent and re-deployed and nothing changed" had no signal at all, and a
 * deleted agent surfaced only as a deploy failure.
 */
export type AgentNodeStatus = "current" | "missing" | "stale";

type KnownAgent = { id: string; version: string };

/**
 * `undefined` when the node is not an agent node, or when the agent list has not
 * loaded: absence of data must not be shown as "missing", which would flag every
 * node on a slow read.
 */
export function agentNodeStatus(
  data: Record<string, unknown>,
  agents: KnownAgent[] | undefined,
): AgentNodeStatus | undefined {
  const id = data.agentId;
  const version = data.agentVersion;

  if (typeof id !== "string" || typeof version !== "string") {
    return undefined;
  }
  if (agents === undefined) {
    return undefined;
  }

  const latest = agents.find((agent) => agent.id === id);

  if (latest === undefined) {
    return "missing";
  }
  return latest.version === version ? "current" : "stale";
}
