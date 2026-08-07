import type { FetchAPI, Middleware } from "@/api-client";

import { PrivateKey } from "@/entities/PrivateKey";
import { AgentsApiSdk } from "@/services/AgentsApi";

import { FakeEmbersEvents } from "./helpers/fakeEvents";
import { TEST_PRIVATE_KEY_HEX } from "./helpers/keys";

// The transport-injection seam.
//
// The generated `Configuration` has always accepted `fetchApi` and
// `middleware`, but no service config exposed them, so a consumer wanting to
// observe or redirect the SDK's requests had to patch `globalThis.fetch` --
// process-wide, and therefore affecting unrelated code in the same process.
// These pin that the options now reach the generated client, which is what
// lets a test assert on a request without patching a global, and what lets an
// integration harness record an exchange without changing where it goes.

const privateKey = PrivateKey.tryFromHex(TEST_PRIVATE_KEY_HEX);

/** A transport that answers everything, so nothing reaches the network. */
function recordingFetch(): { calls: string[]; fetchApi: FetchAPI } {
  const calls: string[] = [];
  // Answers from memory; the promise is the FetchAPI contract.
  // eslint-disable-next-line @typescript-eslint/require-await
  const fetchApi: FetchAPI = async (input, _init) => {
    calls.push(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    return new Response(JSON.stringify({ agents: [] }), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  };
  return { calls, fetchApi };
}

it("routes requests through an injected fetch instead of the global", async () => {
  const { calls, fetchApi } = recordingFetch();
  // If the seam did not work the request would go to the global fetch and try
  // to reach this host, so failing closed here is itself part of the assertion.
  const globalFetch = jest
    .spyOn(globalThis, "fetch")
    .mockRejectedValue(new Error("the global fetch must not be used"));

  const agents = new AgentsApiSdk(
    {
      basePath: "http://embers.invalid",
      fetchApi,
      privateKey,
    },
    new FakeEmbersEvents().asEvents(),
  );

  await agents.get();

  expect(calls).toHaveLength(1);
  expect(calls[0]).toContain("http://embers.invalid");
  expect(globalFetch).not.toHaveBeenCalled();
  globalFetch.mockRestore();
});

it("passes requests through injected middleware", async () => {
  const { fetchApi } = recordingFetch();
  const seen: { url: string }[] = [];
  const middleware: Middleware[] = [
    {
      // The middleware contract is promise-returning; this one records the
      // request and returns without awaiting.
      // eslint-disable-next-line @typescript-eslint/require-await
      pre: async (context) => {
        seen.push({ url: context.url });
        return undefined;
      },
    },
  ];

  const agents = new AgentsApiSdk(
    {
      basePath: "http://embers.invalid",
      fetchApi,
      middleware,
      privateKey,
    },
    new FakeEmbersEvents().asEvents(),
  );

  await agents.get();

  // Middleware wraps rather than replaces, so it observes the same request the
  // transport receives -- the property that makes it usable for a request
  // ledger.
  expect(seen).toHaveLength(1);
  expect(seen[0].url).toContain("http://embers.invalid");
});

it("keeps its previous behavior when neither option is supplied", async () => {
  // Both fields are optional, so an existing caller must be unaffected: with
  // nothing injected the SDK still uses the global fetch.
  const globalFetch = jest.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ agents: [] }), {
      headers: { "content-type": "application/json" },
      status: 200,
    }),
  );

  const agents = new AgentsApiSdk(
    {
      basePath: "http://embers.invalid",
      privateKey,
    },
    new FakeEmbersEvents().asEvents(),
  );

  await agents.get();

  expect(globalFetch).toHaveBeenCalledTimes(1);
  globalFetch.mockRestore();
});
