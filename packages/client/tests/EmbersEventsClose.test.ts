import type { Address } from "@/entities/Address";

import { EmbersEvents } from "@/services/EmbersEvents";

import {
  installMockWebSocket,
  latestWebSocket,
  MockWebSocket,
  observerEvent,
} from "./helpers/mockWebSocket";

// Shutting the event stream down.
//
// The class reconnects on every close, so before `close()` existed it could
// only be abandoned, never stopped: the timer chain kept resurrecting the
// socket, which in Node keeps the event loop alive and the process running.
// That is why the repository's seed script calls `process.exit(0)`, and why an
// integration suite could not finish cleanly. These pin the shutdown contract.

const address = { toString: () => "testAddr123" } as Address;
const config = { address, basePath: "wss://example.com" };

let restoreWebSocket: () => void;

beforeEach(() => {
  jest.useFakeTimers();
  restoreWebSocket = installMockWebSocket();
});

afterEach(() => {
  restoreWebSocket();
  jest.clearAllTimers();
  jest.useRealTimers();
});

it("stops reconnecting once closed", () => {
  const events = new EmbersEvents(config);
  const socket = latestWebSocket();

  events.close();
  // The close the shutdown itself causes must not be read as a dropped
  // connection; before the guard, this is what restarted the loop.
  socket.onclose?.({});
  jest.advanceTimersByTime(120_000);

  expect(MockWebSocket.instances).toHaveLength(1);
});

it("keeps reconnecting when the connection drops on its own", () => {
  // The complement of the test above: closing must not be confused with
  // dropping, or an ordinary network blip would silently end the stream.
  const events = new EmbersEvents(config);
  latestWebSocket().onclose?.({});
  jest.advanceTimersByTime(1000);

  expect(MockWebSocket.instances).toHaveLength(2);
  events.close();
});

it("detaches its handlers so a closing socket cannot call back in", () => {
  const events = new EmbersEvents(config);
  const socket = latestWebSocket();

  events.close();

  expect(socket.onclose).toBeNull();
  expect(socket.onerror).toBeNull();
  expect(socket.onmessage).toBeNull();
  expect(socket.onopen).toBeNull();
});

it("rejects a pending finalization wait rather than leaving it hanging", async () => {
  const events = new EmbersEvents(config);
  const wait = events.subscribeForDeploy("deploy-1", 120_000);

  events.close();

  // Without this the promise could never settle: nothing is listening for the
  // event any more, and its own timeout was cleared with the shutdown.
  await expect(wait).rejects.toThrow(/event stream was closed/);
  // The wording must not read as a failed deploy: send already accepted it.
  await expect(wait).rejects.toThrow(/may still finalize/);
});

it("leaves no timer behind after closing with a wait outstanding", () => {
  const events = new EmbersEvents(config);
  void events.subscribeForDeploy("deploy-1", 120_000).catch(() => undefined);

  events.close();

  // A surviving finalization timeout would hold the process open for two
  // minutes and then reject a promise nobody is waiting on.
  expect(jest.getTimerCount()).toBe(0);
});

it("is idempotent", async () => {
  const events = new EmbersEvents(config);
  const wait = events.subscribeForDeploy("deploy-1", 120_000);
  await expect(
    (async () => {
      events.close();
      events.close();
      events.close();
      return wait;
    })(),
  ).rejects.toThrow(/event stream was closed/);

  expect(MockWebSocket.instances).toHaveLength(1);
});

it("stops delivering to general subscribers after closing", () => {
  const events = new EmbersEvents(config);
  const socket = latestWebSocket();
  const received: unknown[] = [];
  events.subscribe((event) => received.push(event));

  socket.onmessage?.({ data: observerEvent("deploy-1") });
  expect(received).toHaveLength(1);

  events.close();
  // The handler is detached, so this is what a late frame on the old socket
  // would do if anything still held a reference to it.
  socket.onmessage?.({ data: observerEvent("deploy-2") });

  expect(received).toHaveLength(1);
});
