import type { RunCommandReq } from "@/api-client";
import type { Uri } from "@/entities/Uri";

import { PrivateKey } from "@/entities/PrivateKey";
import { AgentsTeamsApiSdk } from "@/services/AgentsTeamsApi";

import {
  contractBytes,
  expectedDeployId,
  parseSendEnvelope,
  signedContractSchema,
  verifyWireSignature,
} from "../helpers/envelope";
import { FakeEmbersEvents } from "../helpers/fakeEvents";
import { OTHER_PRIVATE_KEY_HEX, TEST_PRIVATE_KEY_HEX } from "../helpers/keys";
import { scriptedTransport } from "../helpers/transport";

// The teams service: the same two-phase protocol as agents, plus three things
// only this service does -- registry-signed deploys, and the run lifecycle
// (run, command, reveal), which deliberately does NOT wait for finalization.

const privateKey = PrivateKey.tryFromHex(TEST_PRIVATE_KEY_HEX);
const registryKey = PrivateKey.tryFromHex(OTHER_PRIVATE_KEY_HEX);
const CONTRACT = contractBytes(7, 7, 7, 7);
const TOKEN = "prepare-token";
const TEAM_URI = "rho:id:research-desk" as unknown as Uri;

function makeSdk() {
  const transport = scriptedTransport();
  const events = new FakeEmbersEvents();
  const teams = new AgentsTeamsApiSdk(
    {
      basePath: "http://embers.invalid",
      fetchApi: transport.fetchApi,
      privateKey,
    },
    events.asEvents(),
  );
  return { events, teams, transport };
}

describe("run lifecycle", () => {
  it("runs a team without waiting for finalization", async () => {
    const { events, teams, transport } = makeSdk();
    transport
      .on("/run/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/run/send", { body: { run_id: "run-1" } });

    const result = await teams.run(TEAM_URI, "summarize the corpus");

    // A run is not a chain write the caller waits on: it starts durable work
    // whose progress is followed through the run inspector instead. Waiting
    // here would block the UI on something that has no finalization event.
    expect(events.subscriptions).toHaveLength(0);
    expect(result).not.toHaveProperty("waitForFinalization");
  });

  it("signs the run contract the server prepared", async () => {
    const { teams, transport } = makeSdk();
    transport
      .on("/run/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/run/send", { body: { run_id: "run-1" } });

    await teams.run(TEAM_URI, "summarize the corpus");

    const envelope = parseSendEnvelope(transport.only("/run/send").body);
    const signed = signedContractSchema.parse(envelope.request);
    expect(verifyWireSignature(signed)).toBe(true);
    expect(envelope.prepare_request).toMatchObject({
      prompt: "summarize the corpus",
    });
  });

  it("preserves a command's prepare request byte-for-byte in the envelope", async () => {
    const { teams, transport } = makeSdk();
    const command = {
      decisionId: "decision-1",
      expectedRevision: 4n,
      type: "approve",
      waitId: "wait-1",
    } as unknown as RunCommandReq;
    transport
      .on("/commands/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/commands/send", { body: { revision: 5 } });

    await teams.command("run-1", command);

    // The backend cross-checks this echo against the encrypted command
    // artifact, so any normalization on the way through -- a dropped optional,
    // a renumbered bigint -- makes the command unverifiable rather than merely
    // different.
    const prepare = transport.only("/commands/prepare").body;
    const envelope = parseSendEnvelope(transport.only("/commands/send").body);
    expect(envelope.prepare_request).toEqual(prepare);
  });

  it("addresses commands and reveals to the run in the path", async () => {
    const { teams, transport } = makeSdk();
    transport
      .on("/commands/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/commands/send", { body: {} })
      .on("/output/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/output/send", { body: { output: "done" } });

    await teams.command("run-1", {} as unknown as RunCommandReq);
    await teams.revealOutput("run-1");

    for (const request of transport.requests) {
      expect(request.path).toContain("run-1");
    }
  });

  it("signs a reveal so the server can adjudicate ownership", async () => {
    const { events, teams, transport } = makeSdk();
    transport
      .on("/output/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/output/send", { body: { output: "done" } });

    await teams.revealOutput("run-1");

    const envelope = parseSendEnvelope(transport.only("/output/send").body);
    const signed = signedContractSchema.parse(envelope.request);
    // The signature is what proves ownership: the public ledger scrubs the
    // owner, so this exchange is the only thing that can establish it.
    expect(verifyWireSignature(signed)).toBe(true);
    expect(envelope.prepare_request).toBe("run-1");
    // Like run and command, a reveal is a read rather than a chain write.
    expect(events.subscriptions).toHaveLength(0);
  });
});

describe("registry deploys", () => {
  it("signs the registry insertion with the registry key, not the wallet key", async () => {
    const { teams, transport } = makeSdk();
    transport
      .on("/deploy/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/deploy/send", { body: { deploy_id: "d1" } });

    await teams.deploy("team-1", "version-1", 1n, registryKey);

    const prepare = transport.only("/deploy/prepare").body as {
      deploy: { uri_pub_key: string };
    };
    // The registry entry belongs to a freshly minted key, not the wallet: the
    // uri it produces is what the team is addressed by afterwards. Signing it
    // with the wallet key would publish the team under the wallet's identity.
    // Public keys travel as uppercase base16 (the `public-key` wire format),
    // not base64 like the opaque contract bytes.
    expect(prepare.deploy.uri_pub_key).toBe(registryKey.getPublicKey().toHex());
    expect(prepare.deploy.uri_pub_key).not.toBe(
      privateKey.getPublicKey().toHex(),
    );
  });

  it("waits on the user contract's finalization", async () => {
    const { events, teams, transport } = makeSdk();
    transport
      .on("/deploy/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/deploy/send", { body: { deploy_id: "d1" } });

    await teams.deploy("team-1", "version-1", 1n, registryKey);

    const envelope = parseSendEnvelope(transport.only("/deploy/send").body);
    const request = envelope.request as { contract: unknown };
    const contract = signedContractSchema.parse(request.contract);
    expect(events.lastSubscription().deployId).toBe(expectedDeployId(contract));
  });

  it("carries the registry version the caller asked for", async () => {
    const { teams, transport } = makeSdk();
    transport
      .on("/deploy/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/deploy/send", { body: { deploy_id: "d1" } });

    await teams.deploy("team-1", "version-1", 7n, registryKey);

    const prepare = transport.only("/deploy/prepare").body as {
      deploy: { version: string };
    };
    // Serialized as a string because it is a uint64 on the wire; a silent
    // narrowing to a JS number would corrupt large versions.
    expect(prepare.deploy.version).toBe("7");
  });
});

describe("delete", () => {
  it("posts the signed contract alone, with the team id in the path", async () => {
    const { teams, transport } = makeSdk();
    transport
      .on("/delete/prepare", { body: { contract: CONTRACT } })
      .on("/delete/send", { body: { deploy_id: "d1" } });

    await teams.delete("team-1");

    const send = transport.only("/delete/send");
    const signed = signedContractSchema.parse(send.body);
    expect(send.path).toContain("team-1");
    expect(verifyWireSignature(signed)).toBe(true);
  });
});
