import type {
  Agent,
  AgentHeader,
  Agents,
  AgentsTeam,
  AgentsTeamHeader,
  AgentsTeams,
} from "@f1r3fly-io/embers-client-sdk";

import type { PublishedState, ReferencingTeam } from "@/lib/publishedState";

/**
 * Domain objects for tests, shaped by the generated models.
 *
 * Every builder is typed as the model the SDK actually returns, so a schema
 * regeneration that changes a field breaks these at compile time instead of
 * letting suites keep asserting against a shape the server stopped sending.
 * That is the whole reason they are typed rather than convenient `any` literals.
 *
 * Each takes an overrides object and merges it last, so a test states only the
 * field it cares about and the rest stays valid and uninteresting. Values are
 * deliberately recognisable (`agent-1`, `Researcher`) rather than random: a
 * failure message that names the fixture is easier to read, and randomness in a
 * fixture buys nothing that a property test does not buy better.
 *
 * Dates are fixed. `TimestampMillis` is a `Date`, and sort assertions need a
 * stable order rather than whatever the clock said during the run.
 */
const EPOCH = new Date("2026-01-01T00:00:00.000Z");

/** Distinct fixed timestamps, oldest first, for order-sensitive assertions. */
export function at(offsetMinutes: number): Date {
  return new Date(EPOCH.getTime() + offsetMinutes * 60_000);
}

export function agentHeader(overrides: Partial<AgentHeader> = {}): AgentHeader {
  return {
    createdAt: at(0),
    description: "An agent used in tests",
    id: "agent-1",
    logo: undefined,
    name: "Researcher",
    shard: "root",
    version: "version-1",
    ...overrides,
  };
}

export function agent(overrides: Partial<Agent> = {}): Agent {
  return {
    code: 'new return in { return!("ok") }',
    createdAt: at(0),
    description: "An agent used in tests",
    id: "agent-1",
    logo: undefined,
    name: "Researcher",
    shard: "root",
    version: "version-1",
    ...overrides,
  } as Agent;
}

/** The `agents_list` payload: latest version of each agent in a wallet. */
export function agents(headers: AgentHeader[] = [agentHeader()]): Agents {
  return { agents: headers };
}

export function agentsTeamHeader(
  overrides: Partial<AgentsTeamHeader> = {},
): AgentsTeamHeader {
  return {
    createdAt: at(0),
    description: "A team used in tests",
    id: "team-1",
    logo: undefined,
    name: "Research Desk",
    shard: "root",
    version: "team-version-1",
    ...overrides,
  };
}

export function agentsTeam(overrides: Partial<AgentsTeam> = {}): AgentsTeam {
  return {
    createdAt: at(0),
    description: "A team used in tests",
    id: "team-1",
    logo: undefined,
    name: "Research Desk",
    shard: "root",
    version: "team-version-1",
    ...overrides,
  } as AgentsTeam;
}

export function agentsTeams(
  headers: AgentsTeamHeader[] = [agentsTeamHeader()],
): AgentsTeams {
  return { agentsTeams: headers };
}

/**
 * A team's publication, defaulting to the fully-healthy case.
 *
 * `account_exists` and `active` are three-valued (`null` means the PDS could
 * not be asked), so tests covering the unknown cases must set them explicitly
 * -- defaulting them to `false` here would quietly encode the very conflation
 * the type exists to prevent.
 */
export function publishedState(
  overrides: Partial<PublishedState> = {},
): PublishedState {
  return {
    account_exists: true,
    active: true,
    did: "did:plc:research-desk",
    handle: "research-desk.test",
    is_latest_deployment: true,
    published_version: "team-version-1",
    uri: "rho:id:research-desk",
    ...overrides,
  };
}

/** A team reported by `.../referencing/{agentId}` as using a given agent. */
export function referencingTeam(
  overrides: Partial<ReferencingTeam> = {},
): ReferencingTeam {
  return {
    id: "team-1",
    name: "Research Desk",
    published: false,
    published_handle: null,
    version: "team-version-1",
    ...overrides,
  };
}
