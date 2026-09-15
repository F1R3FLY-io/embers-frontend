import type { CreateAgentReq } from "@/api-client";

import { PrivateKey } from "@/entities/PrivateKey";
import { AgentsApiSdk } from "@/services/AgentsApi";
import { DEFAULT_MAX_WAIT_FOR_FINALISATION } from "@/services/EmbersEvents";

import {
  contractBytes,
  expectedDeployId,
  parseSendEnvelope,
  signedContractSchema,
  verifyWireSignature,
} from "../helpers/envelope";
import { FakeEmbersEvents } from "../helpers/fakeEvents";
import { TEST_PRIVATE_KEY_HEX } from "../helpers/keys";
import { scriptedTransport } from "../helpers/transport";

// The two-phase protocol as the agents service actually performs it.
//
// Every mutating operation is prepare -> sign -> subscribe -> send, and each
// step can fail silently in a way the caller cannot see: a send that echoes the
// wrong prepare, a signature over the wrong bytes, or a finalization
// subscription keyed to an id the observer will never report. The whole service
// layer had no tests at all, so none of that was checked anywhere.

const privateKey = PrivateKey.tryFromHex(TEST_PRIVATE_KEY_HEX);
const CONTRACT = contractBytes(1, 2, 3, 4, 5);
const SYSTEM_CONTRACT = contractBytes(9, 9, 9);
const TOKEN = "prepare-token";

const agentRequest: CreateAgentReq = {
  code: 'new return in { return!("ok") }',
  name: "Researcher",
} as CreateAgentReq;

function makeSdk() {
  const transport = scriptedTransport();
  const events = new FakeEmbersEvents();
  const agents = new AgentsApiSdk(
    {
      basePath: "http://embers.invalid",
      fetchApi: transport.fetchApi,
      privateKey,
    },
    events.asEvents(),
  );
  return { agents, events, transport };
}

describe("create", () => {
  it("prepares, then signs, then sends -- in that order", async () => {
    const { agents, transport } = makeSdk();
    transport
      .on("/create/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/create/send", { body: { deploy_id: "d1" } });

    await agents.create(agentRequest);

    // Send must never precede prepare: the token and contract it carries only
    // exist because prepare produced them.
    expect(transport.order()).toEqual(["/create/prepare", "/create/send"]);
  });

  it("echoes the prepared exchange back in the send envelope", async () => {
    const { agents, transport } = makeSdk();
    transport
      .on("/create/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/create/send", { body: { deploy_id: "d1" } });

    await agents.create(agentRequest);

    const envelope = parseSendEnvelope(transport.only("/create/send").body);
    // The backend rejects a send whose echo does not match the prepare it
    // names, so a drifted echo is a broken client, not a cosmetic difference.
    expect(envelope.token).toBe(TOKEN);
    expect(envelope.prepare_request).toMatchObject({ name: "Researcher" });
    expect(envelope.prepare_response).toMatchObject({ contract: CONTRACT });
  });

  it("signs the contract the server prepared, verifiably", async () => {
    const { agents, transport } = makeSdk();
    transport
      .on("/create/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/create/send", { body: { deploy_id: "d1" } });

    await agents.create(agentRequest);

    const envelope = parseSendEnvelope(transport.only("/create/send").body);
    const signed = signedContractSchema.parse(envelope.request);

    expect(signed.contract).toBe(CONTRACT);
    expect(signed.sig_algorithm).toBe("secp256k1");
    // Recomputed independently: blake2b-256 of the contract, verified against
    // the deployer key in the same payload.
    expect(verifyWireSignature(signed)).toBe(true);
  });

  it("waits on the deploy id the signature implies", async () => {
    const { agents, events, transport } = makeSdk();
    transport
      .on("/create/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/create/send", { body: { deploy_id: "d1" } });

    await agents.create(agentRequest);

    const envelope = parseSendEnvelope(transport.only("/create/send").body);
    const signed = signedContractSchema.parse(envelope.request);

    // If these ever diverge, every finalization wait runs to timeout and the
    // failure looks like a slow chain rather than a client bug.
    expect(events.lastSubscription().deployId).toBe(expectedDeployId(signed));
  });

  it("uses the server's finalization budget, and honors an override", async () => {
    const { agents, events, transport } = makeSdk();
    transport
      .on("/create/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/create/send", { body: { deploy_id: "d1" } });

    await agents.create(agentRequest);
    expect(events.lastSubscription().maxWait).toBe(
      DEFAULT_MAX_WAIT_FOR_FINALISATION,
    );

    await agents.create(agentRequest, { maxWaitForFinalisation: 5_000 });
    expect(events.lastSubscription().maxWait).toBe(5_000);
  });

  it("hands back a finalization promise that settles with the deploy", async () => {
    const { agents, events, transport } = makeSdk();
    transport
      .on("/create/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/create/send", { body: { deploy_id: "d1" } });

    const { waitForFinalization } = await agents.create(agentRequest);
    events.finalize(events.lastSubscription().deployId);

    await expect(waitForFinalization).resolves.toBeUndefined();
  });
});

describe("deploy", () => {
  it("signs the system contract separately when the server prepares one", async () => {
    const { agents, transport } = makeSdk();
    transport
      .on("/deploy/prepare", {
        body: {
          response: { contract: CONTRACT, system: SYSTEM_CONTRACT },
          token: TOKEN,
        },
      })
      .on("/deploy/send", { body: { deploy_id: "d1" } });

    await agents.deploy("agent-1", "version-1");

    const envelope = parseSendEnvelope(transport.only("/deploy/send").body);
    const request = z_request(envelope.request);
    const contract = signedContractSchema.parse(request.contract);
    const system = signedContractSchema.parse(request.system);

    // Two independent signatures over two different payloads: the user's
    // contract and the service's deploy record.
    expect(contract.contract).toBe(CONTRACT);
    expect(system.contract).toBe(SYSTEM_CONTRACT);
    expect(verifyWireSignature(contract)).toBe(true);
    expect(verifyWireSignature(system)).toBe(true);
  });

  it("omits the system contract when the server prepared none", async () => {
    const { agents, transport } = makeSdk();
    transport
      .on("/deploy/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/deploy/send", { body: { deploy_id: "d1" } });

    await agents.deploy("agent-1", "version-1");

    const envelope = parseSendEnvelope(transport.only("/deploy/send").body);
    expect(z_request(envelope.request).system).toBeUndefined();
  });

  it("waits on the user contract's signature, not the system one", async () => {
    const { agents, events, transport } = makeSdk();
    transport
      .on("/deploy/prepare", {
        body: {
          response: { contract: CONTRACT, system: SYSTEM_CONTRACT },
          token: TOKEN,
        },
      })
      .on("/deploy/send", { body: { deploy_id: "d1" } });

    await agents.deploy("agent-1", "version-1");

    const envelope = parseSendEnvelope(transport.only("/deploy/send").body);
    const contract = signedContractSchema.parse(
      z_request(envelope.request).contract,
    );
    expect(events.lastSubscription().deployId).toBe(expectedDeployId(contract));
  });

  it("distinguishes deploying stored code from deploying a literal", async () => {
    const { agents, transport } = makeSdk();
    transport
      .on("/deploy/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/deploy/send", { body: { deploy_id: "d1" } });

    await agents.deployCode("new x in { Nil }");
    const literal = transport.matching("/deploy/prepare")[0];
    expect(literal.body).toMatchObject({ type: "Code" });

    await agents.deploy("agent-1", "version-1");
    const stored = transport.matching("/deploy/prepare")[1];
    // The stored form carries the wallet address; the literal form has no
    // agent to belong to.
    expect(stored.body).toMatchObject({
      id: "agent-1",
      type: "Agent",
      version: "version-1",
    });
  });
});

describe("delete", () => {
  it("signs the bare prepare response, which carries no envelope", async () => {
    const { agents, transport } = makeSdk();
    // Delete is the one asymmetric operation, and it is asymmetric twice over:
    // prepare returns the contract at the top level with no `response` wrapper
    // and no token, and send posts the signed contract AS the whole body --
    // the agent id travels in the path, not the payload. Nothing echoes the
    // prepare back, so the server cannot re-check the exchange the way it does
    // everywhere else.
    transport
      .on("/delete/prepare", { body: { contract: CONTRACT } })
      .on("/delete/send", { body: { deploy_id: "d1" } });

    await agents.delete("agent-1");

    const send = transport.only("/delete/send");
    const signed = signedContractSchema.parse(send.body);

    expect(send.path).toContain("agent-1");
    expect(signed.contract).toBe(CONTRACT);
    expect(verifyWireSignature(signed)).toBe(true);
  });

  it("still waits for finalization despite the different shape", async () => {
    const { agents, events, transport } = makeSdk();
    transport
      .on("/delete/prepare", { body: { contract: CONTRACT } })
      .on("/delete/send", { body: { deploy_id: "d1" } });

    await agents.delete("agent-1");

    expect(events.pending()).toHaveLength(1);
  });
});

describe("failures", () => {
  it("does not send when prepare fails", async () => {
    const { agents, transport } = makeSdk();
    transport.on("/create/prepare", {
      body: { description: "wallet unknown" },
      status: 500,
    });

    await expect(agents.create(agentRequest)).rejects.toBeDefined();

    // A send after a failed prepare would submit an unsigned or stale contract.
    expect(transport.matching("/create/send")).toHaveLength(0);
  });

  it("subscribes for finalization before send, so a failed send leaves the wait pending", async () => {
    const { agents, events, transport } = makeSdk();
    transport
      .on("/create/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/create/send", { body: { description: "rejected" }, status: 400 });

    await expect(agents.create(agentRequest)).rejects.toBeDefined();

    // Pinning current behavior rather than endorsing it: the subscription is
    // registered before the send, so a rejected send leaves it outstanding
    // until its own timeout. Documented here so a future change to the
    // ordering is a deliberate decision rather than an accident.
    expect(events.pending()).toEqual([events.lastSubscription().deployId]);
  });

  it("stops at prepare when the call is aborted", async () => {
    const { agents, transport } = makeSdk();
    transport
      .on("/create/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/create/send", { body: { deploy_id: "d1" } });
    const controller = new AbortController();
    controller.abort();

    await expect(
      agents.create(agentRequest, { signal: controller.signal }),
    ).rejects.toBeDefined();

    expect(transport.matching("/create/send")).toHaveLength(0);
  });
});

describe("reads", () => {
  it("scopes every read to the wallet's own address", async () => {
    const { agents, transport } = makeSdk();
    transport.on("/api/ai-agents", { body: { agents: [] } });

    await agents.get();
    await agents.getVersions("agent-1");
    await agents.getVersion("agent-1", "version-1");

    // The address is derived from the key rather than passed in, so a caller
    // cannot accidentally read another wallet's collection.
    const address = String(agents.address);
    for (const request of transport.requests) {
      expect(request.path).toContain(address);
    }
  });
});

/** Narrows a deploy send's `request` field, which holds two signed contracts. */
function z_request(value: unknown): { contract: unknown; system?: unknown } {
  return value as { contract: unknown; system?: unknown };
}
