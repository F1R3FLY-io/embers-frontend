import type { CreateOslfReq } from "@/api-client";

import { PrivateKey } from "@/entities/PrivateKey";
import { EmbersApiSdk } from "@/services/EmbersApi";
import { OslfsApiSdk } from "@/services/OslfsApi";

import {
  contractBytes,
  expectedDeployId,
  parseSendEnvelope,
  signedContractSchema,
  verifyWireSignature,
} from "../helpers/envelope";
import { FakeEmbersEvents } from "../helpers/fakeEvents";
import { TEST_ADDRESS, TEST_PRIVATE_KEY_HEX } from "../helpers/keys";
import {
  installMockWebSocket,
  latestWebSocket,
  MockWebSocket,
  observerEvent,
  validatorEvent,
} from "../helpers/mockWebSocket";
import { scriptedTransport } from "../helpers/transport";

const privateKey = PrivateKey.tryFromHex(TEST_PRIVATE_KEY_HEX);
const CONTRACT = contractBytes(2, 7, 1, 8);
const TOKEN = "prepare-token";

describe("oslfs", () => {
  function makeSdk() {
    const transport = scriptedTransport();
    const events = new FakeEmbersEvents();
    const oslfs = new OslfsApiSdk(
      {
        basePath: "http://embers.invalid",
        fetchApi: transport.fetchApi,
        privateKey,
      },
      events.asEvents(),
    );
    return { events, oslfs, transport };
  }

  it("follows the same two-phase protocol as the other services", async () => {
    const { events, oslfs, transport } = makeSdk();
    transport
      .on("/create/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/create/send", { body: { deploy_id: "d1" } });

    await oslfs.create({ name: "Query", query: "(and a b)" } as CreateOslfReq);

    // Uniformity is the property worth pinning: the protocol is identical
    // across services, so a divergence here would be a special case nobody
    // documented.
    expect(transport.order()).toEqual(["/create/prepare", "/create/send"]);
    const envelope = parseSendEnvelope(transport.only("/create/send").body);
    const signed = signedContractSchema.parse(envelope.request);
    expect(verifyWireSignature(signed)).toBe(true);
    expect(events.lastSubscription().deployId).toBe(expectedDeployId(signed));
  });

  it("saves against an existing definition by id", async () => {
    const { oslfs, transport } = makeSdk();
    transport
      .on("/save/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/save/send", { body: { deploy_id: "d1" } });

    await oslfs.save("oslf-1", {
      name: "Query",
      query: "(or a b)",
    } as CreateOslfReq);

    expect(transport.only("/save/prepare").path).toContain("oslf-1");
    expect(transport.only("/save/send").path).toContain("oslf-1");
  });

  it("deletes with the bare signed contract, like agents and teams", async () => {
    const { oslfs, transport } = makeSdk();
    transport
      .on("/delete/prepare", { body: { contract: CONTRACT } })
      .on("/delete/send", { body: { deploy_id: "d1" } });

    await oslfs.delete("oslf-1");

    const send = transport.only("/delete/send");
    expect(send.path).toContain("oslf-1");
    expect(verifyWireSignature(signedContractSchema.parse(send.body))).toBe(
      true,
    );
  });
});

describe("EmbersApiSdk facade", () => {
  let restoreWebSocket: () => void;

  beforeEach(() => {
    restoreWebSocket = installMockWebSocket();
  });

  afterEach(() => {
    restoreWebSocket();
  });

  function makeFacade() {
    const transport = scriptedTransport();
    const sdk = new EmbersApiSdk({
      basePath: "http://embers.invalid",
      fetchApi: transport.fetchApi,
      privateKey,
    });
    return { sdk, transport };
  }

  it("opens exactly one event stream, addressed to the wallet it holds", () => {
    makeFacade();

    // One socket for the whole SDK, not one per service: the finalization
    // stream is per wallet, and a socket per service would multiply
    // connections and reconnect storms by six.
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(latestWebSocket().url).toBe(
      `http://embers.invalid/api/wallets/${TEST_ADDRESS}/deploys`,
    );
  });

  it("shares that one stream with every sub-service", async () => {
    const { sdk, transport } = makeFacade();
    transport
      .on("/create/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/create/send", { body: { deploy_id: "d1" } });

    await sdk.agents.create({ code: "x", name: "N" } as never);

    // Still one socket after a mutation subscribed through it.
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it("resolves a real finalization wait when the observer reports the deploy", async () => {
    const { sdk, transport } = makeFacade();
    transport
      .on("/create/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/create/send", { body: { deploy_id: "d1" } });

    const { waitForFinalization } = await sdk.agents.create({
      code: "x",
      name: "N",
    } as never);

    const envelope = parseSendEnvelope(transport.only("/create/send").body);
    const deployId = expectedDeployId(
      signedContractSchema.parse(envelope.request),
    );

    // A validator frame must not settle it: only the observer confirms the
    // deploy is finalized AND readable, which is what callers act on.
    latestWebSocket().onmessage?.({ data: validatorEvent(deployId) });
    let settled = false;
    void waitForFinalization.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    latestWebSocket().onmessage?.({ data: observerEvent(deployId) });
    await expect(waitForFinalization).resolves.toBeUndefined();
  });

  it("can be shut down without leaving the socket reconnecting", () => {
    const { sdk } = makeFacade();

    sdk.events.close();
    latestWebSocket().onclose?.({});

    // The whole reason close() was added: an abandoned SDK used to keep a
    // reconnect chain alive, which in Node prevents the process from exiting.
    expect(MockWebSocket.instances).toHaveLength(1);
  });
});
