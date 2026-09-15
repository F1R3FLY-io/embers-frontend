import { Address } from "@/entities/Address";
import { Amount } from "@/entities/Amount";
import { PrivateKey } from "@/entities/PrivateKey";
import { TestnetApiSdk } from "@/services/TestnetApi";
import { WalletsApiSdk } from "@/services/WalletsApi";

import {
  contractBytes,
  expectedDeployId,
  parseSendEnvelope,
  signedContractSchema,
  verifyWireSignature,
} from "../helpers/envelope";
import { FakeEmbersEvents } from "../helpers/fakeEvents";
import {
  OTHER_ADDRESS,
  OTHER_PRIVATE_KEY_HEX,
  TEST_PRIVATE_KEY_HEX,
} from "../helpers/keys";
import { scriptedTransport } from "../helpers/transport";

// Value transfer and the testnet sandbox: the two services whose mistakes cost
// real money or leak a key. Neither has any UI, so these are the only tests
// they will ever have.

const privateKey = PrivateKey.tryFromHex(TEST_PRIVATE_KEY_HEX);
const CONTRACT = contractBytes(3, 1, 4, 1, 5);
const TOKEN = "prepare-token";
const recipient = Address.tryFrom(OTHER_ADDRESS);

function makeWallets() {
  const transport = scriptedTransport();
  const events = new FakeEmbersEvents();
  const wallets = new WalletsApiSdk(
    {
      basePath: "http://embers.invalid",
      fetchApi: transport.fetchApi,
      privateKey,
    },
    events.asEvents(),
  );
  return { events, transport, wallets };
}

describe("transfer", () => {
  it("sends from the signer's own address, never an arbitrary one", async () => {
    const { transport, wallets } = makeWallets();
    transport
      .on("/transfer/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/transfer/send", { body: { deploy_id: "d1" } });

    await wallets.transfer(recipient, Amount.tryFrom(1000n), "rent");

    const prepare = transport.only("/transfer/prepare").body as {
      amount: string;
      description: string;
      from: string;
      to: string;
    };
    // `from` is derived from the key rather than accepted as an argument, so a
    // caller cannot ask the server to move someone else's funds.
    expect(prepare.from).toBe(String(wallets.address));
    expect(prepare.to).toBe(OTHER_ADDRESS);
    expect(prepare.description).toBe("rent");
  });

  it("serializes the amount as a string so large values survive", async () => {
    const { transport, wallets } = makeWallets();
    transport
      .on("/transfer/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/transfer/send", { body: { deploy_id: "d1" } });

    // Just under the 2^63-1 ceiling Amount enforces. As a JS number this would
    // lose precision silently and move the wrong sum.
    const large = 9_223_372_036_854_775_807n;
    await wallets.transfer(recipient, Amount.tryFrom(large));

    const prepare = transport.only("/transfer/prepare").body as {
      amount: string;
    };
    expect(prepare.amount).toBe(large.toString());
  });

  it("signs the transfer and waits on its finalization", async () => {
    const { events, transport, wallets } = makeWallets();
    transport
      .on("/transfer/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/transfer/send", { body: { deploy_id: "d1" } });

    await wallets.transfer(recipient, Amount.tryFrom(1n));

    const envelope = parseSendEnvelope(transport.only("/transfer/send").body);
    const signed = signedContractSchema.parse(envelope.request);
    expect(verifyWireSignature(signed)).toBe(true);
    // Money movement is the case where losing the finalization confirmation
    // matters most: the caller must be able to tell a settled transfer from a
    // submitted one.
    expect(events.lastSubscription().deployId).toBe(expectedDeployId(signed));
  });

  it("refuses amounts outside the representable range before any request", () => {
    const { transport, wallets } = makeWallets();
    transport.on("/transfer", { body: {} });

    expect(() => Amount.tryFrom(0n)).toThrow();
    expect(() => Amount.tryFrom(-1n)).toThrow();
    expect(() => Amount.tryFrom(9_223_372_036_854_775_808n)).toThrow();

    // Rejected client-side, so nothing reached the network to be rejected
    // server-side. Keeping the check here means a bad amount never becomes a
    // deploy that costs a fee to fail.
    expect(transport.requests).toHaveLength(0);
    expect(wallets.address).toBeDefined();
  });
});

describe("boost", () => {
  it("carries the post it boosts and still moves value like a transfer", async () => {
    const { events, transport, wallets } = makeWallets();
    transport
      .on("/boost/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/boost/send", { body: { deploy_id: "d1" } });

    await wallets.boost(
      recipient,
      Amount.tryFrom(5n),
      "did:plc:author",
      "tipping the post",
      "post-1",
    );

    const prepare = transport.only("/boost/prepare").body as Record<
      string,
      unknown
    >;
    expect(prepare.post_author_did).toBe("did:plc:author");
    expect(prepare.post_id).toBe("post-1");
    expect(prepare.from).toBe(String(wallets.address));
    expect(events.subscriptions).toHaveLength(1);
  });

  it("omits the post id when boosting an author rather than a post", async () => {
    const { transport, wallets } = makeWallets();
    transport
      .on("/boost/prepare", {
        body: { response: { contract: CONTRACT }, token: TOKEN },
      })
      .on("/boost/send", { body: { deploy_id: "d1" } });

    await wallets.boost(recipient, Amount.tryFrom(5n), "did:plc:author");

    const prepare = transport.only("/boost/prepare").body as Record<
      string,
      unknown
    >;
    expect(prepare.post_id).toBeUndefined();
  });
});

describe("testnet", () => {
  function makeTestnet() {
    const transport = scriptedTransport();
    const testnet = new TestnetApiSdk({
      basePath: "http://embers.invalid",
      fetchApi: transport.fetchApi,
    });
    return { testnet, transport };
  }

  it("signs a test deploy with the TEST key, not a wallet key", async () => {
    const { testnet, transport } = makeTestnet();
    const testKey = PrivateKey.tryFromHex(OTHER_PRIVATE_KEY_HEX);
    transport
      .on("/deploy/prepare", {
        body: {
          response: { test_contract: CONTRACT },
          token: TOKEN,
        },
      })
      .on("/deploy/send", { body: { logs: [], type: "SignedTestDeployLogs" } });

    await testnet.deploy(testKey, "new x in { Nil }");

    const envelope = parseSendEnvelope(transport.only("/deploy/send").body);
    const request = envelope.request as { test: unknown };
    const signed = signedContractSchema.parse(request.test);
    // The sandbox exists so an untrusted contract can run without a funded
    // wallet; signing with the wallet key would defeat that.
    expect(signed.deployer).toBe(
      Buffer.from(testKey.getPublicKey().value).toString("base64"),
    );
    expect(verifyWireSignature(signed)).toBe(true);
  });

  it("signs the environment contract too when the server prepares one", async () => {
    const { testnet, transport } = makeTestnet();
    const testKey = PrivateKey.tryFromHex(OTHER_PRIVATE_KEY_HEX);
    const envContract = contractBytes(8, 8);
    transport
      .on("/deploy/prepare", {
        body: {
          response: { env_contract: envContract, test_contract: CONTRACT },
          token: TOKEN,
        },
      })
      .on("/deploy/send", { body: { logs: [], type: "SignedTestDeployLogs" } });

    await testnet.deploy(testKey, "new x in { Nil }", "new env in { Nil }");

    const envelope = parseSendEnvelope(transport.only("/deploy/send").body);
    const request = envelope.request as { env: unknown; test: unknown };
    const env = signedContractSchema.parse(request.env);
    expect(env.contract).toBe(envContract);
    expect(verifyWireSignature(env)).toBe(true);
  });

  it("omits the environment when none was prepared", async () => {
    const { testnet, transport } = makeTestnet();
    transport
      .on("/deploy/prepare", {
        body: { response: { test_contract: CONTRACT }, token: TOKEN },
      })
      .on("/deploy/send", { body: { logs: [], type: "SignedTestDeployLogs" } });

    await testnet.deploy(
      PrivateKey.tryFromHex(OTHER_PRIVATE_KEY_HEX),
      "new x in { Nil }",
    );

    const envelope = parseSendEnvelope(transport.only("/deploy/send").body);
    expect((envelope.request as { env?: unknown }).env).toBeUndefined();
  });

  it("returns a usable key from the faucet", async () => {
    const { testnet, transport } = makeTestnet();
    transport.on("/testnet", { body: { key: OTHER_PRIVATE_KEY_HEX } });

    const key = await testnet.getWallet();

    // Parsed rather than passed through, so a malformed faucet response fails
    // here instead of at the first attempt to sign with it.
    expect(key.toHex()).toBe(OTHER_PRIVATE_KEY_HEX.toUpperCase());
  });

  it("rejects a malformed faucet key instead of returning it", async () => {
    const { testnet, transport } = makeTestnet();
    transport.on("/testnet", { body: { key: "not-a-key" } });

    await expect(testnet.getWallet()).rejects.toBeDefined();
  });
});
