import type { TeamRecord } from "../store";
import type { Route } from "../wire";

import { newTeamUri } from "../keys";
import {
  agentIdsIn,
  badRequest,
  CONTRACT_BASE64,
  json,
  newId,
  newVersion,
  notFound,
  prepared,
  preparedOf,
  signatureOf,
  timestamp,
} from "../wire";

/**
 * The team half of the API: list, read a version, create, save, deploy,
 * publish, unpublish, delete, and the two reads the delete cascade depends on.
 *
 * Two behaviours here are load-bearing rather than incidental.
 *
 * The referencing endpoint answers from the stored definition, so a team the
 * APPLICATION assembled reports its real agents. Tracking references
 * separately would make the cascade warning right about seeded fixtures and
 * silent about anything a journey actually built -- which is the case that
 * matters, since that is how the bug shipped.
 *
 * A deploy records the URI and the version it deployed. Both are what the
 * editor reads back to decide whether to offer Run or Deploy, and whether a
 * publication is still pointing at the newest deployment.
 */

const LIST = /^\/api\/ai-agents-teams\/[^/]+$/;
const VERSIONS = /^\/api\/ai-agents-teams\/[^/]+\/([^/]+)\/versions$/;
const VERSION = /^\/api\/ai-agents-teams\/[^/]+\/([^/]+)\/versions\/([^/]+)$/;
const REFERENCING = /^\/api\/ai-agents-teams\/[^/]+\/referencing\/([^/]+)$/;
const PUBLISHED = /^\/api\/ai-agents-teams\/[^/]+\/([^/]+)\/published$/;
const UNPUBLISH = /^\/api\/ai-agents-teams\/[^/]+\/([^/]+)\/unpublish$/;
const PUBLISH_PREPARE =
  /^\/api\/ai-agents-teams\/[^/]+\/([^/]+)\/publish-to-firesky\/prepare$/;
const PUBLISH_SEND =
  /^\/api\/ai-agents-teams\/[^/]+\/([^/]+)\/publish-to-firesky\/send$/;
const SAVE_PREPARE = /^\/api\/ai-agents-teams\/([^/]+)\/save\/prepare$/;
const SAVE_SEND = /^\/api\/ai-agents-teams\/([^/]+)\/save\/send$/;
const DELETE_PREPARE = /^\/api\/ai-agents-teams\/([^/]+)\/delete\/prepare$/;
const DELETE_SEND = /^\/api\/ai-agents-teams\/([^/]+)\/delete\/send$/;

interface CreateTeamReqWire {
  definition?: unknown;
  description?: string;
  logo?: string;
  name?: string;
}

export const teamRoutes: Route = ({ body, finalize, method, path, store }) => {
  if (!path.startsWith("/api/ai-agents-teams/")) {
    return undefined;
  }

  if (method === "GET") {
    const referencing = REFERENCING.exec(path);
    if (referencing !== null) {
      return json(
        store.teamsReferencing(referencing[1]).map((team) => ({
          id: team.id,
          name: team.name,
          published: team.published !== null,
          published_handle: team.published?.handle ?? null,
          version: team.version,
        })),
      );
    }

    const published = PUBLISHED.exec(path);
    if (published !== null) {
      const team = store.teams.find((entry) => entry.id === published[1]);
      // A 404 is the API saying "not published", not a failure -- the app reads
      // it as `null` and carries on.
      return team?.published === null || team?.published === undefined
        ? notFound()
        : json(team.published);
    }

    if (LIST.test(path)) {
      return json({
        agents_teams: store.listView("teams", store.teams).map(teamHeader),
      });
    }

    const versions = VERSIONS.exec(path);
    if (versions !== null) {
      const history = store.teamHistory.get(versions[1]) ?? [];
      return json({ agents_teams: [...history].reverse().map(teamHeader) });
    }

    const version = VERSION.exec(path);
    if (version !== null) {
      const team = store.teamVersion(version[1], version[2]);
      return team === undefined ? notFound() : json(teamBody(team));
    }
  }

  if (method !== "POST") {
    return undefined;
  }

  const unpublish = UNPUBLISH.exec(path);
  if (unpublish !== null) {
    const team = store.teams.find((entry) => entry.id === unpublish[1]);
    if (team?.published !== null && team?.published !== undefined) {
      // The account and its handle survive: unpublishing removes the record
      // that makes F1R3SKY treat the handle as a team, so the same handle can
      // be published to again.
      team.published = { ...team.published, active: false };
    }
    return json({});
  }

  if (path === "/api/ai-agents-teams/create/prepare") {
    return prepared({ id: newId(), version: newVersion() });
  }

  if (path === "/api/ai-agents-teams/create/send") {
    store.snapshot("teams");
    const { request, response } = preparedOf(body) as {
      request: CreateTeamReqWire;
      response: { id: string; version: string };
    };

    store.addTeam({
      agentIds: agentIdsIn(request.definition),
      definition: request.definition,
      description: request.description,
      id: response.id,
      logo: request.logo,
      name: request.name ?? "Team",
      version: response.version,
    });
    finalize(signatureOf(body));
    return json({ deploy_id: "team-create" });
  }

  const savePrepare = SAVE_PREPARE.exec(path);
  if (savePrepare !== null) {
    return store.teams.some((team) => team.id === savePrepare[1])
      ? prepared({ version: newVersion() })
      : badRequest(`no agents team with id ${savePrepare[1]}`);
  }

  const saveSend = SAVE_SEND.exec(path);
  if (saveSend !== null) {
    store.snapshot("teams");
    const { request, response } = preparedOf(body) as {
      request: CreateTeamReqWire;
      response: { version: string };
    };

    const saved = store.saveTeam(saveSend[1], {
      agentIds: agentIdsIn(request.definition),
      definition: request.definition,
      description: request.description,
      logo: request.logo,
      name: request.name,
      version: response.version,
    });
    if (saved === undefined) {
      return badRequest(`no agents team with id ${saveSend[1]}`);
    }
    finalize(signatureOf(body));
    return json({ deploy_id: "team-save" });
  }

  if (path === "/api/ai-agents-teams/deploy/prepare") {
    return prepared({});
  }

  if (path === "/api/ai-agents-teams/deploy/send") {
    store.snapshot("teams");
    const { request } = preparedOf(body) as {
      request: { id?: string; version?: string };
    };

    if (typeof request.id === "string") {
      // Only a deploy writes a URI. A team that failed to deploy must not look
      // deployed, which is the whole reason this is not set anywhere else.
      store.markTeamDeployed(request.id, newTeamUri());
    }
    finalize(signatureOf(body));
    return json({ deploy_id: "team-deploy" });
  }

  if (PUBLISH_PREPARE.test(path)) {
    return prepared({});
  }

  const publishSend = PUBLISH_SEND.exec(path);
  if (publishSend !== null) {
    const { request } = preparedOf(body) as {
      request: { handle?: string };
    };
    const team = store.teams.find((entry) => entry.id === publishSend[1]);
    if (team === undefined) {
      return badRequest(`no agents team with id ${publishSend[1]}`);
    }
    team.published = {
      account_exists: true,
      active: true,
      did: `did:plc:${team.id.slice(0, 12)}`,
      handle: request.handle ?? "team.test",
      is_latest_deployment: true,
      published_version: team.version,
      uri: team.uri ?? newTeamUri(),
    };
    finalize(signatureOf(body));
    return json({ deploy_id: "team-publish" });
  }

  if (DELETE_PREPARE.test(path)) {
    return json({ contract: CONTRACT_BASE64 });
  }

  const deleteSend = DELETE_SEND.exec(path);
  if (deleteSend !== null) {
    store.snapshot("teams");
    const id = deleteSend[1];
    store.teams = store.teams.filter((team) => team.id !== id);
    store.teamHistory.delete(id);
    finalize(signatureOf(body));
    return json({ deploy_id: "team-delete" });
  }

  return undefined;
};

function teamHeader(team: TeamRecord) {
  return {
    created_at: timestamp(team.createdAt),
    description: team.description,
    id: team.id,
    last_deploy:
      team.lastDeploy === undefined ? undefined : timestamp(team.lastDeploy),
    logo: team.logo,
    name: team.name,
    uri: team.uri,
    version: team.version,
  };
}

/**
 * A team version, as the editor reloads it.
 *
 * `definition` and not `graph`: the app prefers the Workflow v2 document when
 * both are present, and `graph` is deserialized through the WebAssembly parser
 * -- which belongs in the browser, not in this process.
 */
function teamBody(team: TeamRecord) {
  return { ...teamHeader(team), definition: team.definition ?? null };
}
