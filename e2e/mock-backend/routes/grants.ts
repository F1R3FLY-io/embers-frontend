import type { GrantRecord, RunRecord } from "../store";
import type { Route } from "../wire";

import {
  json,
  newId,
  notFound,
  prepared,
  preparedOf,
  signatureOf,
  timestamp,
} from "../wire";

/**
 * The channel-connector half of the API: grants, runs under grants, the run
 * inspector, the owner/grantee output reveal, mail bindings, and the per-team
 * reachability aggregation.
 *
 * Two behaviours are load-bearing here.
 *
 * Failures carry `{code, description}`: the real surface added a
 * machine-readable taxonomy precisely so channel services and the grants UI
 * can branch without parsing prose, and a mock that answered plain 400s would
 * let the app pass while never exercising that branching.
 *
 * The day counter is enforced. A grant with a cap admits that many runs per
 * UTC epoch day and answers `grant_caps_exceeded` after, because cap
 * exhaustion is a state the UI must render truthfully and a test must be able
 * to reach deterministically.
 */

const REVOKE_PREPARE = /^\/api\/ai-agents-teams\/grants\/([^/]+)\/revoke\/prepare$/;
const REVOKE_SEND = /^\/api\/ai-agents-teams\/grants\/([^/]+)\/revoke\/send$/;
const BY_GRANTOR = /^\/api\/ai-agents-teams\/grants\/by-grantor\/([^/]+)$/;
const BY_GRANTEE = /^\/api\/ai-agents-teams\/grants\/by-grantee\/([^/]+)$/;
const RUN_STATE = /^\/api\/ai-agents-teams\/runs\/([^/]+)$/;
const REVEAL_PREPARE = /^\/api\/ai-agents-teams\/runs\/([^/]+)\/output\/prepare$/;
const REVEAL_SEND = /^\/api\/ai-agents-teams\/runs\/([^/]+)\/output\/send$/;
const PUBLISH_MAIL_PREPARE =
  /^\/api\/ai-agents-teams\/[^/]+\/([^/]+)\/publish-to-mail\/prepare$/;
const PUBLISH_MAIL_SEND =
  /^\/api\/ai-agents-teams\/[^/]+\/([^/]+)\/publish-to-mail\/send$/;
const UNPUBLISH_MAIL_PREPARE =
  /^\/api\/ai-agents-teams\/[^/]+\/([^/]+)\/unpublish-mail\/prepare$/;
const UNPUBLISH_MAIL_SEND =
  /^\/api\/ai-agents-teams\/[^/]+\/([^/]+)\/unpublish-mail\/send$/;
const PUBLISHED_CHANNELS =
  /^\/api\/ai-agents-teams\/[^/]+\/([^/]+)\/published-channels$/;
const BINDINGS_BY_CHANNEL =
  /^\/api\/ai-agents-teams\/bindings\/by-channel\/([^/]+)$/;

const GRANT_CHANNELS = new Set(["chat", "mail"]);
const DELEGABLE_CLASSES = new Set([
  "approve",
  "cancel",
  "event",
  "reject",
  "retry",
  "signal",
]);
const MIN_AUTH_LEVELS = new Set(["dkim", "dmarc", "none", "spf"]);
const MAIL_LOCAL_PART = /^[a-z0-9](?:[a-z0-9._+-]*[a-z0-9+_-])?$/;
const MAIL_DOMAIN = /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/;

interface CreateGrantWire {
  agents_team?: string;
  authority?: { commands?: string[]; reveal?: boolean };
  caps?: { max_runs_per_day?: string | null };
  channel?: string;
  channel_principal?: string;
  grantee?: string;
  min_auth?: string;
  require_token?: boolean;
}

interface RunUnderGrantWire {
  channel_context?: {
    channel?: string;
    message_fingerprint?: string;
    principal?: string;
    subject?: string;
  };
  grant_id?: string;
  prompt?: string;
}

function failure(code: string, description: string, status: number) {
  return json({ code, description }, status);
}

function epochDay(): number {
  return Math.floor(Date.now() / 86_400_000);
}

function grantWire(grant: GrantRecord) {
  return {
    agents_team: grant.agentsTeam,
    authority: {
      commands: grant.authority.commands,
      reveal: grant.authority.reveal,
    },
    caps: {
      max_runs_per_day:
        grant.caps.maxRunsPerDay === null
          ? null
          : String(grant.caps.maxRunsPerDay),
    },
    channel: grant.channel,
    channel_principal: grant.channelPrincipal,
    created_at: timestamp(grant.createdAt),
    grant_id: grant.grantId,
    grantee: grant.grantee,
    grantor: grant.grantor,
    min_auth: grant.minAuth,
    require_token_hash: grant.requireTokenHash,
    revoked: grant.revoked,
    runs_today: {
      count: String(grant.runsToday.count),
      day: String(grant.runsToday.day),
    },
  };
}

function runStateWire(run: RunRecord) {
  // Each read advances the scripted status walk, so a run's progress is
  // driven by the app's own polling.
  if (run.script.length > 0) {
    run.status = run.script.shift() ?? run.status;
    run.revision += 1;
    run.events.push({
      event_type: run.status === "completed" ? "runCompleted" : run.status,
      sequence: run.events.length,
    });
  }
  return {
    agents_team: run.teamUri,
    created_at: timestamp(run.createdAt),
    definition_hash: "definition-hash",
    events: run.events.map((event) => ({
      event_type: event.event_type,
      sequence: String(event.sequence),
    })),
    grant_id: run.grantId ?? null,
    output_capability_hash: run.status === "completed" ? "output-capability" : null,
    output_content_hash: run.status === "completed" ? "output-content" : null,
    revision: String(run.revision),
    run_id: run.id,
    status: run.status,
    wait_ids: run.waitIds,
  };
}

export const grantRoutes: Route = ({ body, finalize, method, path, store }) => {
  if (!path.startsWith("/api/ai-agents-teams/")) {
    return undefined;
  }

  if (method === "GET") {
    const byGrantor = BY_GRANTOR.exec(path);
    if (byGrantor !== null) {
      return json(
        [...store.grants.values()]
          .filter((grant) => grant.grantor === byGrantor[1])
          .map(grantWire),
      );
    }

    const byGrantee = BY_GRANTEE.exec(path);
    if (byGrantee !== null) {
      return json(
        [...store.grants.values()]
          .filter((grant) => grant.grantee === byGrantee[1])
          .map(grantWire),
      );
    }

    const bindings = BINDINGS_BY_CHANNEL.exec(path);
    if (bindings !== null) {
      return json(
        [...store.bindings.values()]
          .filter((binding) => binding.channel === bindings[1])
          .map((binding) => ({
            active: binding.active,
            address: binding.address,
            agents_team: binding.agentsTeam,
            channel: binding.channel,
            created_at: timestamp(binding.createdAt),
            owner: binding.owner,
            team_id: binding.teamId,
          })),
      );
    }

    const publishedChannels = PUBLISHED_CHANNELS.exec(path);
    if (publishedChannels !== null) {
      const teamId = publishedChannels[1];
      const team = store.teams.find((entry) => entry.id === teamId);
      const teamUris = new Set(
        (store.teamHistory.get(teamId) ?? [])
          .map((version) => version.uri)
          .filter((uri): uri is string => uri !== undefined),
      );
      const chatGrants = [...store.grants.values()].filter(
        (grant) =>
          grant.channel === "chat" &&
          !grant.revoked &&
          teamUris.has(grant.agentsTeam),
      );
      return json({
        chat: {
          active_grant_count: String(chatGrants.length),
          principals: [
            ...new Set(chatGrants.map((grant) => grant.channelPrincipal)),
          ].sort(),
        },
        firesky: team?.published ?? null,
        mail: [...store.bindings.values()]
          .filter(
            (binding) => binding.channel === "mail" && binding.teamId === teamId,
          )
          .map((binding) => ({
            active: binding.active,
            address: binding.address,
            // Deliberately unknown: the server never probes SMTP, and the UI
            // must render that as "unknown", not as "missing".
            reachable: null,
          })),
      });
    }

    const runState = RUN_STATE.exec(path);
    if (runState !== null) {
      const run = store.runs.get(runState[1]);
      return run === undefined ? notFound() : json(runStateWire(run));
    }
  }

  if (method !== "POST") {
    return undefined;
  }

  if (path === "/api/ai-agents-teams/grants/create/prepare") {
    const request = body as CreateGrantWire;
    if (
      request.channel === undefined ||
      !GRANT_CHANNELS.has(request.channel)
    ) {
      return failure(
        "grant_invalid_request",
        `unknown grant channel ${String(request.channel)}`,
        422,
      );
    }
    if (
      request.min_auth !== undefined &&
      !MIN_AUTH_LEVELS.has(request.min_auth)
    ) {
      return failure(
        "grant_invalid_request",
        `unknown min_auth level ${request.min_auth}`,
        422,
      );
    }
    for (const command of request.authority?.commands ?? []) {
      if (!DELEGABLE_CLASSES.has(command)) {
        return failure(
          "grant_invalid_request",
          `command class ${command} is not delegable`,
          422,
        );
      }
    }
    return prepared({
      grant_id: newId(),
      issued_at: timestamp(Date.now()),
      require_token:
        request.require_token === true ? "aa".repeat(32) : null,
    });
  }

  if (path === "/api/ai-agents-teams/grants/create/send") {
    const { request, response } = preparedOf(body) as {
      request: CreateGrantWire;
      response: { grant_id: string; require_token?: string | null };
    };
    store.addGrant({
      agentsTeam: request.agents_team ?? "rho:id:team",
      authority: {
        commands: request.authority?.commands ?? [],
        reveal: request.authority?.reveal ?? false,
      },
      caps: {
        maxRunsPerDay:
          request.caps?.max_runs_per_day === null ||
          request.caps?.max_runs_per_day === undefined
            ? null
            : Number(request.caps.max_runs_per_day),
      },
      channel: request.channel ?? "chat",
      channelPrincipal: request.channel_principal ?? "",
      grantee: request.grantee ?? "",
      grantId: response.grant_id,
      // The chain derives the grantor from the deploy's signer; the mock has
      // no chain, so the signature bytes stand in as the signer identity.
      grantor: `signer:${signatureOf(body).slice(0, 16)}`,
      minAuth: request.min_auth ?? "none",
      requireTokenHash:
        response.require_token === null || response.require_token === undefined
          ? null
          : "hash-of-token",
    });
    finalize(signatureOf(body));
    return json({ deploy_id: "grant-create" });
  }

  const revokePrepare = REVOKE_PREPARE.exec(path);
  if (revokePrepare !== null) {
    return store.grants.has(revokePrepare[1])
      ? prepared({})
      : failure("grant_not_found", "grant not found", 404);
  }

  const revokeSend = REVOKE_SEND.exec(path);
  if (revokeSend !== null) {
    const grant = store.grants.get(revokeSend[1]);
    if (grant === undefined) {
      return failure("grant_not_found", "grant not found", 404);
    }
    grant.revoked = true;
    finalize(signatureOf(body));
    return json({ deploy_id: "grant-revoke" });
  }

  if (path === "/api/ai-agents-teams/run-under-grant/prepare") {
    const request = body as RunUnderGrantWire;
    const grant =
      request.grant_id === undefined
        ? undefined
        : store.grants.get(request.grant_id);
    if (grant === undefined) {
      return failure("grant_not_found", "grant not found", 404);
    }
    if (grant.revoked) {
      return failure("grant_revoked", "grant is revoked", 403);
    }
    if (
      request.channel_context?.channel !== grant.channel ||
      request.channel_context.principal !== grant.channelPrincipal
    ) {
      return failure(
        "grant_principal_mismatch",
        "channel context does not match the grant's principal",
        422,
      );
    }
    if (
      grant.caps.maxRunsPerDay !== null &&
      grant.runsToday.day === epochDay() &&
      grant.runsToday.count >= grant.caps.maxRunsPerDay
    ) {
      return failure(
        "grant_caps_exceeded",
        "grant daily run cap exhausted",
        429,
      );
    }
    const runId = newId();
    return prepared({
      agents_team: grant.agentsTeam,
      grant_id: grant.grantId,
      run: {
        continuation_capability_hash: "continuation-capability",
        continuation_content_hash: "continuation-content",
        contract: "AQIDBAU=",
        created_at: timestamp(Date.now()),
        definition_hash: "definition-hash",
        durable: true,
        request_capability_hash: "request-capability",
        request_content_hash: "request-content",
        run_id: runId,
      },
    });
  }

  if (path === "/api/ai-agents-teams/run-under-grant/send") {
    const { request, response } = preparedOf(body) as {
      request: RunUnderGrantWire;
      response: {
        agents_team: string;
        grant_id: string;
        run: { run_id: string };
      };
    };
    const grant = store.grants.get(response.grant_id);
    if (grant === undefined) {
      return failure("grant_not_found", "grant not found", 404);
    }
    if (grant.revoked) {
      return failure("grant_revoked", "grant is revoked", 403);
    }
    if (grant.caps.maxRunsPerDay !== null) {
      const today = epochDay();
      const count = grant.runsToday.day === today ? grant.runsToday.count : 0;
      if (count >= grant.caps.maxRunsPerDay) {
        return failure(
          "grant_caps_exceeded",
          "grant daily run cap exhausted",
          429,
        );
      }
      grant.runsToday = { count: count + 1, day: today };
    }
    const run: RunRecord = {
      createdAt: Date.now(),
      events: [{ event_type: "runStarted", sequence: 0 }],
      grantId: response.grant_id,
      id: response.run.run_id,
      output: JSON.stringify({
        answer: `ran ${response.agents_team} for ${String(request.prompt)}`,
      }),
      revision: 0,
      script: ["running", "completed"],
      status: "running",
      teamUri: response.agents_team,
      waitIds: [],
    };
    store.runs.set(run.id, run);
    finalize(signatureOf(body));
    return json(runStateWire(run));
  }

  const revealPrepare = REVEAL_PREPARE.exec(path);
  if (revealPrepare !== null) {
    const run = store.runs.get(revealPrepare[1]);
    if (run === undefined) {
      return notFound();
    }
    if (run.status !== "completed") {
      return json({ description: "run has no recorded output" }, 409);
    }
    return prepared({
      issued_at: timestamp(Date.now()),
      output_capability_hash: "output-capability",
      output_content_hash: "output-content",
      reveal_id: newId(),
    });
  }

  const revealSend = REVEAL_SEND.exec(path);
  if (revealSend !== null) {
    const run = store.runs.get(revealSend[1]);
    if (run === undefined) {
      return notFound();
    }
    if (run.status !== "completed" || run.output === undefined) {
      return json({ description: "run has no recorded output" }, 409);
    }
    // Revocation cuts a grantee's disclosure immediately: a revealed grant
    // link whose grant is revoked answers 403, exactly as the chain clause
    // refuses the claim.
    if (run.grantId !== undefined) {
      const grant = store.grants.get(run.grantId);
      if (grant !== undefined && grant.revoked) {
        return json({ description: "output reveal actor is unauthorized" }, 403);
      }
    }
    run.events.push({
      event_type: "outputRevealed",
      sequence: run.events.length,
    });
    finalize(signatureOf(body));
    return json(JSON.parse(run.output) as Record<string, unknown>);
  }

  const publishMailPrepare = PUBLISH_MAIL_PREPARE.exec(path);
  if (publishMailPrepare !== null) {
    const teamId = publishMailPrepare[1];
    const request = body as { local_part?: string; mail_domain?: string };
    const team = store.teams.find((entry) => entry.id === teamId);
    if (team === undefined) {
      return failure(
        "team_not_found",
        "the team does not exist under the address",
        404,
      );
    }
    if (team.uri === undefined) {
      return failure(
        "team_not_deployed",
        "the team has no deployment to bind",
        422,
      );
    }
    const local = (request.local_part ?? "").toLowerCase();
    const domain = (request.mail_domain ?? "").toLowerCase();
    if (!MAIL_LOCAL_PART.test(local) || !MAIL_DOMAIN.test(domain)) {
      return failure(
        "invalid_mail_address",
        "the mail address fails the grammar",
        422,
      );
    }
    const address = `${local}@${domain}`;
    const existing = store.bindings.get(`mail|${address}`);
    if (existing !== undefined && existing.active && existing.teamId !== teamId) {
      return failure(
        "binding_duplicate",
        "the mail address is already bound to another team",
        409,
      );
    }
    return prepared({ address });
  }

  const publishMailSend = PUBLISH_MAIL_SEND.exec(path);
  if (publishMailSend !== null) {
    const teamId = publishMailSend[1];
    const { response } = preparedOf(body) as { response: { address: string } };
    const team = store.teams.find((entry) => entry.id === teamId);
    const existing = store.bindings.get(`mail|${response.address}`);
    if (existing !== undefined && existing.active && existing.teamId !== teamId) {
      return failure(
        "binding_duplicate",
        "the mail address is already bound to another team",
        409,
      );
    }
    store.addBinding({
      address: response.address,
      agentsTeam: team?.uri ?? "rho:id:team",
      channel: "mail",
      owner: `signer:${signatureOf(body).slice(0, 16)}`,
      teamId,
    });
    finalize(signatureOf(body));
    return json({ deploy_id: "mail-publish" });
  }

  const unpublishMailPrepare = UNPUBLISH_MAIL_PREPARE.exec(path);
  if (unpublishMailPrepare !== null) {
    const teamId = unpublishMailPrepare[1];
    const binding = [...store.bindings.values()].find(
      (entry) => entry.channel === "mail" && entry.teamId === teamId && entry.active,
    );
    return binding === undefined
      ? failure(
          "binding_not_found",
          "no active mail binding exists for the team",
          404,
        )
      : prepared({ address: binding.address });
  }

  const unpublishMailSend = UNPUBLISH_MAIL_SEND.exec(path);
  if (unpublishMailSend !== null) {
    const { response } = preparedOf(body) as { response: { address: string } };
    const binding = store.bindings.get(`mail|${response.address}`);
    if (binding === undefined) {
      return failure(
        "binding_not_found",
        "no active mail binding exists for the team",
        404,
      );
    }
    binding.active = false;
    finalize(signatureOf(body));
    return json({ deploy_id: "mail-unpublish" });
  }

  return undefined;
};
