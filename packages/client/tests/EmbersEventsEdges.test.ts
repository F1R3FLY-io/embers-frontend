import type { Address } from "@/entities/Address";

import { EmbersEvents } from "@/services/EmbersEvents";

import {
  installMockWebSocket,
  latestWebSocket,
  observerEvent,
} from "./helpers/mockWebSocket";

// How the event stream behaves at its edges: malformed frames, failed deploys,
// and a deploy id subscribed twice.
//
// Each of these pins CURRENT behavior rather than endorsing it. Two are
// arguably wrong, and saying so here -- with the consequence spelled out --
// makes changing them a deliberate decision with a test that has to be updated,
// instead of an accident nobody notices.

const address = { toString: () => "testAddr123" } as Address;
const config = { address, basePath: "wss://example.com" };

let restoreWebSocket: () => void;
let events: EmbersEvents;

beforeEach(() => {
  jest.useFakeTimers();
  restoreWebSocket = installMockWebSocket();
  events = new EmbersEvents(config);
});

afterEach(() => {
  events.close();
  restoreWebSocket();
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe("malformed frames", () => {
  it("throws out of the socket handler on a frame that is not JSON", () => {
    // PINNED, NOT ENDORSED. The parse happens inline in `onmessage` with no
    // guard, so a malformed frame throws into the WebSocket callback. In a
    // browser that surfaces as an uncaught error and the socket keeps running;
    // nothing retries and nothing tells the user. A single bad frame from a
    // future server version would therefore be invisible except in the console.
    // Worth hardening; recorded here so the hardening is a choice.
    expect(() => latestWebSocket().onmessage?.({ data: "not json" })).toThrow();
  });

  it("throws on a frame whose shape does not match the schema", () => {
    const wrongShape = JSON.stringify({
      deploy_id: "d1",
      node_type: "Observer",
      type: "Finalized",
    });

    // `cost` and `errored` are required; the schema refuses to guess.
    expect(() => latestWebSocket().onmessage?.({ data: wrongShape })).toThrow();
  });

  it("throws on an unknown event type rather than ignoring it", () => {
    const unknownType = JSON.stringify({
      cost: "1",
      deploy_id: "d1",
      errored: false,
      node_type: "Observer",
      type: "SomethingNew",
    });

    // A discriminated union with one member: a new server event type is a
    // hard failure rather than a silent no-op. That is the safer default --
    // silently dropping an event the client does not understand is how a
    // client keeps waiting for something that already happened.
    expect(() =>
      latestWebSocket().onmessage?.({ data: unknownType }),
    ).toThrow();
  });

  it("throws when the cost cannot be read as a number", () => {
    const badCost = JSON.stringify({
      cost: "not-a-number",
      deploy_id: "d1",
      errored: false,
      node_type: "Observer",
      type: "Finalized",
    });

    expect(() => latestWebSocket().onmessage?.({ data: badCost })).toThrow();
  });
});

describe("failed deploys", () => {
  it("rejects the wait when the deploy finalized but failed on chain", async () => {
    // `errored: true` means the deploy finalized and its execution FAILED --
    // insufficient funds at execution time, or a contract that threw. This
    // used to resolve, identically to success, so a caller who awaited
    // finalization and then reported "saved" reported success for a deploy
    // that recorded nothing. Every caller treats a resolved wait as success,
    // so resolving was the worst available answer.
    const wait = events.subscribeForDeploy("deploy-1", 120_000);

    latestWebSocket().onmessage?.({
      data: observerEvent("deploy-1", "100", true),
    });

    await expect(wait).rejects.toThrow(/execution\s+failed on chain/);
  });

  it("tells the caller that a failed deploy is safe to retry", async () => {
    // The opposite advice from the timeout case, and the distinction matters:
    // a timeout means the deploy may still land, so retrying risks a duplicate;
    // an errored finalization is settled and recorded nothing, so retrying is
    // the correct response.
    const wait = events.subscribeForDeploy("deploy-1", 120_000);

    latestWebSocket().onmessage?.({
      data: observerEvent("deploy-1", "100", true),
    });

    await expect(wait).rejects.toThrow(/can be retried/);
  });

  it("still succeeds when the deploy finalized cleanly", async () => {
    const wait = events.subscribeForDeploy("deploy-1", 120_000);

    latestWebSocket().onmessage?.({
      data: observerEvent("deploy-1", "100", false),
    });

    await expect(wait).resolves.toBeUndefined();
  });

  it("delivers the errored flag to general subscribers as well", async () => {
    // Subscribers see the raw event either way, so a dock or log view can
    // report the failure alongside the rejected wait.
    const seen: { errored: boolean }[] = [];
    events.subscribe((event) => seen.push({ errored: event.errored }));

    latestWebSocket().onmessage?.({
      data: observerEvent("deploy-1", "100", true),
    });

    expect(seen).toEqual([{ errored: true }]);
    await Promise.resolve();
  });
});

describe("duplicate subscriptions", () => {
  it("abandons the first wait when the same deploy id is subscribed twice", async () => {
    // PINNED, NOT ENDORSED. The map is keyed by deploy id, so a second
    // subscription REPLACES the first. The first promise is then unreachable:
    // it can only settle via its own timeout, minutes later. Deploy ids are
    // signature-derived and so collide only if the same contract is signed
    // twice, which makes this rare rather than impossible.
    const first = events.subscribeForDeploy("deploy-1", 5_000);
    const second = events.subscribeForDeploy("deploy-1", 5_000);

    latestWebSocket().onmessage?.({ data: observerEvent("deploy-1") });

    await expect(second).resolves.toBeUndefined();

    // The first is still outstanding, and only its own timeout will end it.
    let firstSettled = false;
    void first.catch(() => {
      firstSettled = true;
    });
    await Promise.resolve();
    expect(firstSettled).toBe(false);

    jest.advanceTimersByTime(5_000);
    await expect(first).rejects.toThrow(/timed out/);
  });
});

describe("unsubscribe", () => {
  it("ignores an id that was never subscribed", () => {
    expect(() => events.unsubscribe(12345)).not.toThrow();
  });

  it("stops delivery for the id it is given without affecting others", () => {
    const kept: number[] = [];
    const dropped: number[] = [];
    events.subscribe(() => kept.push(1));
    const droppedId = events.subscribe(() => dropped.push(1));

    events.unsubscribe(droppedId);
    latestWebSocket().onmessage?.({ data: observerEvent("deploy-1") });

    expect(kept).toHaveLength(1);
    expect(dropped).toHaveLength(0);
  });
});
