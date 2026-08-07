import type { AgentRecord } from "../store";
import type { Route } from "../wire";

import {
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
 * The agent half of the API: list, read a version, create, save, deploy,
 * delete.
 *
 * Every write is prepare -> sign -> send. The prepare hands back the identity
 * the record will have, and the send is where it actually appears -- which is
 * also where the finalization event is emitted, because the client is already
 * waiting on it by then.
 */

const LIST = /^\/api\/ai-agents\/[^/]+$/;
const VERSIONS = /^\/api\/ai-agents\/[^/]+\/([^/]+)\/versions$/;
const VERSION = /^\/api\/ai-agents\/[^/]+\/([^/]+)\/versions\/([^/]+)$/;
const SAVE_PREPARE = /^\/api\/ai-agents\/([^/]+)\/save\/prepare$/;
const SAVE_SEND = /^\/api\/ai-agents\/([^/]+)\/save\/send$/;
const DELETE_PREPARE = /^\/api\/ai-agents\/([^/]+)\/delete\/prepare$/;
const DELETE_SEND = /^\/api\/ai-agents\/([^/]+)\/delete\/send$/;

interface CreateAgentReqWire {
  code?: string;
  description?: string;
  logo?: string;
  name?: string;
}

export const agentRoutes: Route = ({ body, finalize, method, path, store }) => {
  // The teams API shares the `ai-agents` prefix, so an exact discrimination is
  // needed rather than a substring test.
  if (!path.startsWith("/api/ai-agents/")) {
    return undefined;
  }

  if (method === "GET") {
    if (LIST.test(path)) {
      return json({
        agents: store.listView("agents", store.agents).map(agentHeader),
      });
    }

    const versions = VERSIONS.exec(path);
    if (versions !== null) {
      // Newest first: the sidebar's version picker shows the current version at
      // the top, and the editor opens on it.
      const history = store.agentHistory.get(versions[1]) ?? [];
      return json({ agents: [...history].reverse().map(agentHeader) });
    }

    const version = VERSION.exec(path);
    if (version !== null) {
      const agent = store.agentVersion(version[1], version[2]);
      return agent === undefined ? notFound() : json(agentBody(agent));
    }
  }

  if (method !== "POST") {
    return undefined;
  }

  if (path === "/api/ai-agents/create/prepare") {
    return prepared({ id: newId(), version: newVersion() });
  }

  if (path === "/api/ai-agents/create/send") {
    // Snapshot before the write so a configured lag can serve the pre-write
    // view: that is the state in which a created record is invisible until
    // something else triggers a fetch.
    store.snapshot("agents");
    const { request, response } = preparedOf(body) as {
      request: CreateAgentReqWire;
      response: { id: string; version: string };
    };

    store.addAgent({
      code: request.code ?? "",
      description: request.description,
      id: response.id,
      logo: request.logo,
      name: request.name ?? "Agent",
      version: response.version,
    });
    finalize(signatureOf(body));
    return json({ deploy_id: "agent-create" });
  }

  const savePrepare = SAVE_PREPARE.exec(path);
  if (savePrepare !== null) {
    return store.agents.some((agent) => agent.id === savePrepare[1])
      ? prepared({ version: newVersion() })
      : badRequest(`no agent with id ${savePrepare[1]}`);
  }

  const saveSend = SAVE_SEND.exec(path);
  if (saveSend !== null) {
    store.snapshot("agents");
    const { request, response } = preparedOf(body) as {
      request: CreateAgentReqWire;
      response: { version: string };
    };

    const saved = store.saveAgent(saveSend[1], {
      code: request.code,
      description: request.description,
      logo: request.logo,
      name: request.name,
      version: response.version,
    });
    if (saved === undefined) {
      return badRequest(`no agent with id ${saveSend[1]}`);
    }
    finalize(signatureOf(body));
    return json({ deploy_id: "agent-save" });
  }

  if (path === "/api/ai-agents/deploy/prepare") {
    // `system` is the second contract a deploy of a system agent needs signing.
    // Omitted here: the browser journeys deploy ordinary agents, and offering a
    // system contract that nothing checks would be a shape the app handles
    // without any test meaning it.
    return prepared({});
  }

  if (path === "/api/ai-agents/deploy/send") {
    store.snapshot("agents");
    const { request } = preparedOf(body) as {
      request: { id?: string; version?: string };
    };

    if (typeof request.id === "string") {
      store.markAgentDeployed(request.id);
    }
    finalize(signatureOf(body));
    return json({ deploy_id: "agent-deploy" });
  }

  if (DELETE_PREPARE.test(path)) {
    // Bare, with no token envelope: a delete's prepare answers `{contract}`
    // directly, and the send posts the signed contract as the whole body.
    return json({ contract: CONTRACT_BASE64 });
  }

  const deleteSend = DELETE_SEND.exec(path);
  if (deleteSend !== null) {
    store.snapshot("agents");
    const id = deleteSend[1];
    store.agents = store.agents.filter((agent) => agent.id !== id);
    store.agentHistory.delete(id);
    finalize(signatureOf(body));
    return json({ deploy_id: "agent-delete" });
  }

  return undefined;
};

function agentHeader(agent: AgentRecord) {
  return {
    created_at: timestamp(agent.createdAt),
    description: agent.description,
    id: agent.id,
    last_deploy:
      agent.lastDeploy === undefined ? undefined : timestamp(agent.lastDeploy),
    logo: agent.logo,
    name: agent.name,
    version: agent.version,
  };
}

function agentBody(agent: AgentRecord) {
  return { ...agentHeader(agent), code: agent.code };
}
