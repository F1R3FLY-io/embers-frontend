import type { Address } from "@/entities/Address";
import type { WalletEvent } from "@/services/EmbersEvents";

import {
  DEFAULT_MAX_WAIT_FOR_FINALISATION,
  EmbersEvents,
} from "@/services/EmbersEvents";

// ---------------------------------------------------------------------------
// WebSocket mock
// ---------------------------------------------------------------------------

const wsInstances: MockWebSocket[] = [];

class MockWebSocket {
  public url: string;
  public onopen: ((ev: unknown) => void) | null = null;
  public onclose: ((ev: unknown) => void) | null = null;
  public onerror: ((ev: unknown) => void) | null = null;
  public onmessage: ((ev: { data: string }) => void) | null = null;

  public constructor(url: string) {
    this.url = url;
    wsInstances.push(this);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockAddress = { toString: () => "testAddr123" } as Address;

function makeConfig() {
  return { address: mockAddress, basePath: "wss://example.com" };
}

function observerEvent(deployId: string, cost = "100") {
  return JSON.stringify({
    cost,
    deploy_id: deployId,
    errored: false,
    node_type: "Observer",
    type: "Finalized",
  });
}

function validatorEvent(deployId: string) {
  return JSON.stringify({
    cost: "50",
    deploy_id: deployId,
    errored: false,
    node_type: "Validator",
    type: "Finalized",
  });
}

/** Get the most-recently created MockWebSocket. */
function latestWs(): MockWebSocket {
  return wsInstances[wsInstances.length - 1];
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.useFakeTimers();
  wsInstances.length = 0;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = MockWebSocket;
});

afterEach(() => {
  jest.useRealTimers();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  delete (globalThis as any).WebSocket;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("EmbersEvents", () => {
  describe("constants", () => {
    test("DEFAULT_MAX_WAIT_FOR_FINALISATION is 45_000ms", () => {
      expect(DEFAULT_MAX_WAIT_FOR_FINALISATION).toBe(45_000);
    });
  });

  describe("constructor", () => {
    test("creates WebSocket with correct URL", () => {
      const _events = new EmbersEvents(makeConfig());

      expect(wsInstances).toHaveLength(1);
      expect(wsInstances[0].url).toBe(
        "wss://example.com/api/wallets/testAddr123/deploys",
      );
    });

    test("assigns onmessage, onopen, onclose, onerror handlers", () => {
      const _events = new EmbersEvents(makeConfig());
      const ws = latestWs();

      expect(typeof ws.onmessage).toBe("function");
      expect(typeof ws.onopen).toBe("function");
      expect(typeof ws.onclose).toBe("function");
      expect(typeof ws.onerror).toBe("function");
    });
  });

  describe("handleMessage", () => {
    test("resolves deploy subscription for Observer Finalized event", async () => {
      const events = new EmbersEvents(makeConfig());
      const ws = latestWs();

      const promise = events.subscribeForDeploy("deploy-1", 60_000);
      ws.onmessage!({ data: observerEvent("deploy-1") });

      await expect(promise).resolves.toBeUndefined();
    });

    test("notifies general subscribers for Observer event", () => {
      const events = new EmbersEvents(makeConfig());
      const ws = latestWs();

      const callback = jest.fn<(e: WalletEvent) => void>();
      events.subscribe(callback);

      ws.onmessage!({ data: observerEvent("deploy-1", "200") });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          cost: 200n,
          deploy_id: "deploy-1",
          node_type: "Observer",
          type: "Finalized",
        }),
      );
    });

    test("ignores Validator events -- does not resolve deploy subscriptions", async () => {
      const events = new EmbersEvents(makeConfig());
      const ws = latestWs();

      const promise = events.subscribeForDeploy("deploy-1", 5_000);
      ws.onmessage!({ data: validatorEvent("deploy-1") });

      // The Validator event should NOT have resolved the subscription.
      // Advance past the timeout to prove it rejects.
      jest.advanceTimersByTime(5_000);
      await expect(promise).rejects.toThrow("timeout");
    });

    test("ignores Validator events -- does not notify general subscribers", () => {
      const events = new EmbersEvents(makeConfig());
      const ws = latestWs();

      const callback = jest.fn();
      events.subscribe(callback);

      ws.onmessage!({ data: validatorEvent("deploy-1") });

      expect(callback).not.toHaveBeenCalled();
    });

    test("removes deploy subscription after resolution (no double-fire)", async () => {
      const events = new EmbersEvents(makeConfig());
      const ws = latestWs();

      const promise = events.subscribeForDeploy("deploy-1", 60_000);
      ws.onmessage!({ data: observerEvent("deploy-1") });
      await expect(promise).resolves.toBeUndefined();

      // Firing again should be a no-op (subscription was deleted).
      // This should not throw.
      ws.onmessage!({ data: observerEvent("deploy-1") });
    });
  });

  describe("subscribeForDeploy", () => {
    test("resolves when matching deploy event arrives before timeout", async () => {
      const events = new EmbersEvents(makeConfig());
      const ws = latestWs();

      const promise = events.subscribeForDeploy("deploy-1", 10_000);

      // Advance part-way, then deliver the event.
      jest.advanceTimersByTime(5_000);
      ws.onmessage!({ data: observerEvent("deploy-1") });

      await expect(promise).resolves.toBeUndefined();
    });

    test("rejects with 'timeout' after maxWait elapses", async () => {
      const events = new EmbersEvents(makeConfig());

      const promise = events.subscribeForDeploy("deploy-1", 5_000);
      jest.advanceTimersByTime(5_000);

      await expect(promise).rejects.toThrow("timeout");
    });

    test("clears timeout when resolved by event (no late rejection)", async () => {
      const events = new EmbersEvents(makeConfig());
      const ws = latestWs();

      const promise = events.subscribeForDeploy("deploy-1", 5_000);
      ws.onmessage!({ data: observerEvent("deploy-1") });
      await expect(promise).resolves.toBeUndefined();

      // Advance well past the original timeout -- should NOT cause a rejection.
      jest.advanceTimersByTime(10_000);
    });

    test("removes subscription from map on timeout (late event is no-op)", async () => {
      const events = new EmbersEvents(makeConfig());
      const ws = latestWs();

      const promise = events.subscribeForDeploy("deploy-1", 5_000);
      jest.advanceTimersByTime(5_000);
      await expect(promise).rejects.toThrow("timeout");

      // Late event should not throw or resolve anything.
      ws.onmessage!({ data: observerEvent("deploy-1") });
    });
  });

  describe("subscribe / unsubscribe", () => {
    test("returns a numeric ID", () => {
      const events = new EmbersEvents(makeConfig());
      const id = events.subscribe(() => {});
      expect(typeof id).toBe("number");
    });

    test("subscriber receives Observer wallet events with parsed data", () => {
      const events = new EmbersEvents(makeConfig());
      const ws = latestWs();

      const callback = jest.fn<(e: WalletEvent) => void>();
      events.subscribe(callback);

      ws.onmessage!({ data: observerEvent("d1", "999") });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ cost: 999n }),
      );
    });

    test("unsubscribe stops event delivery", () => {
      const events = new EmbersEvents(makeConfig());
      const ws = latestWs();

      const callback = jest.fn();
      const id = events.subscribe(callback);
      events.unsubscribe(id);

      ws.onmessage!({ data: observerEvent("d1") });

      expect(callback).not.toHaveBeenCalled();
    });

    test("multiple subscribers each receive the event", () => {
      const events = new EmbersEvents(makeConfig());
      const ws = latestWs();

      const cb1 = jest.fn();
      const cb2 = jest.fn();
      events.subscribe(cb1);
      events.subscribe(cb2);

      ws.onmessage!({ data: observerEvent("d1") });

      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });
  });

  describe("reconnection", () => {
    test("onclose triggers reconnect after delay", () => {
      const _events = new EmbersEvents(makeConfig());
      expect(wsInstances).toHaveLength(1);

      latestWs().onclose!({});

      // Before the delay fires, no new WebSocket.
      expect(wsInstances).toHaveLength(1);

      jest.advanceTimersByTime(1_000);
      expect(wsInstances).toHaveLength(2);
    });

    test("new WebSocket has same URL", () => {
      const _events = new EmbersEvents(makeConfig());
      const originalUrl = latestWs().url;

      latestWs().onclose!({});
      jest.advanceTimersByTime(1_000);

      expect(latestWs().url).toBe(originalUrl);
    });

    test("exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped), 30s", () => {
      const _events = new EmbersEvents(makeConfig());

      const expectedDelays = [
        1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000,
      ];

      for (const delay of expectedDelays) {
        const countBefore = wsInstances.length;
        latestWs().onclose!({});

        // Just before the delay, no new WebSocket.
        jest.advanceTimersByTime(delay - 1);
        expect(wsInstances).toHaveLength(countBefore);

        // At exactly the delay, reconnect fires.
        jest.advanceTimersByTime(1);
        expect(wsInstances).toHaveLength(countBefore + 1);
      }
    });

    test("backoff resets to 1s after successful connection (onopen)", () => {
      const _events = new EmbersEvents(makeConfig());

      // Escalate backoff: close -> reconnect at 1s, close -> reconnect at 2s
      latestWs().onclose!({});
      jest.advanceTimersByTime(1_000);

      latestWs().onclose!({});
      jest.advanceTimersByTime(2_000);

      // Now fire onopen to reset backoff.
      latestWs().onopen!({});

      // Next close should reconnect at 1s (reset), not 4s.
      const countBefore = wsInstances.length;
      latestWs().onclose!({});

      jest.advanceTimersByTime(999);
      expect(wsInstances).toHaveLength(countBefore);

      jest.advanceTimersByTime(1);
      expect(wsInstances).toHaveLength(countBefore + 1);
    });

    test("handlers are reattached on the new WebSocket", () => {
      const _events = new EmbersEvents(makeConfig());

      latestWs().onclose!({});
      jest.advanceTimersByTime(1_000);

      const newWs = latestWs();
      expect(typeof newWs.onmessage).toBe("function");
      expect(typeof newWs.onopen).toBe("function");
      expect(typeof newWs.onclose).toBe("function");
      expect(typeof newWs.onerror).toBe("function");
    });

    test("message handling works on reconnected WebSocket", () => {
      const events = new EmbersEvents(makeConfig());
      const callback = jest.fn<(e: WalletEvent) => void>();
      events.subscribe(callback);

      // Reconnect
      latestWs().onclose!({});
      jest.advanceTimersByTime(1_000);

      // Send message on new WebSocket
      latestWs().onmessage!({ data: observerEvent("deploy-1") });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ deploy_id: "deploy-1" }),
      );
    });
  });
});
