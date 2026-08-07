import { randomUUID } from "node:crypto";

/**
 * The state a mock Embers backend has to hold, and the semantics that matter
 * to the app.
 *
 * Deliberately not a database: the app cares about five things, and every one
 * of them is a behavior that has produced a bug before.
 *
 *  - VERSIONING. Records are append-only; a save adds a version and the list
 *    reports the newest. The editor decides what to save against from this.
 *  - OBSERVER LAG. A write is accepted before it is visible, so the list can
 *    answer 200 with an out-of-date view. This is the single most productive
 *    fault to be able to simulate: it is what made a created agent invisible
 *    until a manual refresh, and a deleted one come back.
 *  - REFERENCES. Which teams use which agent, so the delete-cascade warning
 *    has something true to say.
 *  - PUBLICATION. Whether a team answers mentions, which the delete flow must
 *    read before it can safely remove one.
 *  - DEPLOYMENT. Whether a team has ever been deployed, and against which
 *    version -- what decides whether the editor offers Run or Deploy, and
 *    whether a publication is pointing at the newest deployment.
 */

export interface AgentRecord {
  code: string;
  createdAt: number;
  description?: string;
  id: string;
  lastDeploy?: number;
  logo?: string;
  name: string;
  version: string;
}

export interface TeamRecord {
  /** Ids of the agents this team's latest version references. */
  agentIds: string[];
  createdAt: number;
  /** The Workflow v2 document; what the editor reloads a team from. */
  definition?: unknown;
  description?: string;
  id: string;
  lastDeploy?: number;
  logo?: string;
  name: string;
  published: PublicationRecord | null;
  uri?: string;
  version: string;
}

export interface PublicationRecord {
  account_exists: boolean | null;
  active: boolean | null;
  did: string | null;
  handle: string | null;
  is_latest_deployment: boolean;
  published_version: string;
  uri: string;
}

export interface RunRecord {
  createdAt: number;
  events: { event_type: string; sequence: number }[];
  id: string;
  output?: string;
  revision: number;
  /**
   * Statuses to walk through, one per read, ending on the last.
   *
   * Scripted by read count rather than by wall clock so a run's progress is
   * driven by the app's own polling. A time-based script would make the test
   * depend on how fast the machine is.
   */
  script: string[];
  status: string;
  teamUri: string;
  waitIds: string[];
}

export interface Failure {
  description: string;
  /** How many further calls fail; undefined means every call. */
  remaining?: number;
  status: number;
}

export class Store {
  /** The latest version of every agent that exists. */
  public agents: AgentRecord[] = [];
  /** The latest version of every team that exists. */
  public teams: TeamRecord[] = [];
  public runs = new Map<string, RunRecord>();

  /** Every version ever written, oldest first, keyed by record id. */
  public agentHistory = new Map<string, AgentRecord[]>();
  public teamHistory = new Map<string, TeamRecord[]>();

  /** Failures keyed by a path fragment, e.g. "/delete/send". */
  public failures = new Map<string, Failure>();

  /**
   * How many further list reads answer with a snapshot taken before the last
   * write, keyed by collection.
   */
  public staleReads = new Map<string, number>();

  private snapshots = new Map<string, unknown>();

  public reset(): void {
    this.agents = [];
    this.teams = [];
    this.runs.clear();
    this.agentHistory.clear();
    this.teamHistory.clear();
    this.failures.clear();
    this.staleReads.clear();
    this.snapshots.clear();
  }

  public addAgent(partial: Partial<AgentRecord> = {}): AgentRecord {
    const agent: AgentRecord = {
      code: 'new return in { return!("ok") }',
      createdAt: Date.now(),
      id: randomUUID(),
      name: "Agent",
      version: randomUUID(),
      ...partial,
    };
    this.agents.push(agent);
    this.agentHistory.set(agent.id, [agent]);
    return agent;
  }

  public addTeam(partial: Partial<TeamRecord> = {}): TeamRecord {
    const team: TeamRecord = {
      agentIds: [],
      createdAt: Date.now(),
      id: randomUUID(),
      name: "Team",
      published: null,
      version: randomUUID(),
      ...partial,
    };
    this.teams.push(team);
    this.teamHistory.set(team.id, [team]);
    return team;
  }

  /**
   * Appends a version to an existing record.
   *
   * The new version becomes what the list reports, and the old one stays
   * readable. Both halves matter: the editor polls the list for the version it
   * just wrote, and reopening an older version has to still work.
   */
  public saveAgent(
    id: string,
    patch: Partial<AgentRecord>,
  ): AgentRecord | undefined {
    const current = this.agents.find((agent) => agent.id === id);
    if (current === undefined) {
      return undefined;
    }
    const next: AgentRecord = { ...current, ...patch, id };
    this.agents = this.agents.map((agent) => (agent.id === id ? next : agent));
    this.agentHistory.set(id, [...(this.agentHistory.get(id) ?? []), next]);
    return next;
  }

  public saveTeam(
    id: string,
    patch: Partial<TeamRecord>,
  ): TeamRecord | undefined {
    const current = this.teams.find((team) => team.id === id);
    if (current === undefined) {
      return undefined;
    }
    const next: TeamRecord = { ...current, ...patch, id };
    this.teams = this.teams.map((team) => (team.id === id ? next : team));
    this.teamHistory.set(id, [...(this.teamHistory.get(id) ?? []), next]);
    return next;
  }

  /**
   * Records a deployment against the version that is current.
   *
   * Deliberately in place rather than appending a version: a deploy publishes
   * an existing version, it does not author a new one. Appending would make
   * the editor's "no unsaved changes" reasoning wrong the moment a team was
   * deployed, because the version it holds would no longer be the newest.
   *
   * The record object is shared between the list and its history entry, so one
   * mutation updates both views.
   */
  public markAgentDeployed(id: string, at: number = Date.now()): void {
    const agent = this.agents.find((entry) => entry.id === id);
    if (agent !== undefined) {
      agent.lastDeploy = at;
    }
  }

  public markTeamDeployed(id: string, uri: string, at: number = Date.now()) {
    const team = this.teams.find((entry) => entry.id === id);
    if (team === undefined) {
      return;
    }
    team.lastDeploy = at;
    // Keep the URI a team already has: re-deploying does not move it, and a
    // changing URI would break every run link the user already holds.
    team.uri ??= uri;
    if (team.published !== null) {
      // The publication now names an older deployment than the newest one,
      // which is what the editor labels as a stale publish.
      team.published = { ...team.published, is_latest_deployment: false };
    }
  }

  /**
   * One version of a record, with "latest" resolving to the newest.
   *
   * "latest" is what the dashboard passes when opening an editor, so it is the
   * path most journeys take.
   */
  public agentVersion(id: string, version: string): AgentRecord | undefined {
    const history = this.agentHistory.get(id) ?? [];
    return version === "latest"
      ? history.at(-1)
      : history.find((agent) => agent.version === version);
  }

  public teamVersion(id: string, version: string): TeamRecord | undefined {
    const history = this.teamHistory.get(id) ?? [];
    return version === "latest"
      ? history.at(-1)
      : history.find((team) => team.version === version);
  }

  /** Records the current contents so a stale read can serve them afterwards. */
  public snapshot(collection: string): void {
    this.snapshots.set(
      collection,
      JSON.parse(
        JSON.stringify(collection === "agents" ? this.agents : this.teams),
      ) as unknown,
    );
  }

  /**
   * The view a list read should return, honoring any configured lag.
   *
   * Each stale read consumes one from the budget, so a test says "be behind
   * for two reads" and the third converges -- which is what makes the app's
   * polling loop observable rather than merely present.
   */
  public listView<T>(collection: string, live: T[]): T[] {
    const remaining = this.staleReads.get(collection) ?? 0;
    if (remaining <= 0) {
      return live;
    }
    this.staleReads.set(collection, remaining - 1);
    return (this.snapshots.get(collection) as T[] | undefined) ?? live;
  }

  /** Consumes a configured failure for a path, if one applies. */
  public takeFailure(path: string): Failure | undefined {
    for (const [fragment, failure] of this.failures) {
      if (!path.includes(fragment)) {
        continue;
      }
      if (failure.remaining === undefined) {
        return failure;
      }
      if (failure.remaining <= 0) {
        continue;
      }
      failure.remaining -= 1;
      return failure;
    }
    return undefined;
  }

  /** Teams whose latest version references the given agent. */
  public teamsReferencing(agentId: string): TeamRecord[] {
    return this.teams.filter((team) => team.agentIds.includes(agentId));
  }
}
