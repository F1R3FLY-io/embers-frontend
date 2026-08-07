/**
 * A WebSocket stand-in with frame-level control.
 *
 * `EmbersEvents` constructs `new WebSocket(...)` itself, so the only way to
 * drive finalization from a test is to replace the global. This class records
 * every instance and exposes the handlers directly, which is what lets a test
 * deliver one frame at a chosen moment and assert what the SDK did with it --
 * something a network-level fake cannot express, since the interesting
 * behaviors here are ordering, reconnection, and timeout.
 *
 * Promoted out of EmbersEvents.test.ts so service-level suites can drive
 * finalization the same way. A copy lives in the app's test helpers; the two
 * are intentionally independent, because a shared workspace package would have
 * to be built before either suite could run.
 */
export class MockWebSocket {
  public static instances: MockWebSocket[] = [];

  public onclose: ((ev: unknown) => void) | null = null;
  public onerror: ((ev: unknown) => void) | null = null;
  public onmessage: ((ev: { data: string }) => void) | null = null;
  public onopen: ((ev: unknown) => void) | null = null;
  public closed = false;
  public sent: string[] = [];
  public url: string;

  public constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  /** Records outbound frames; the SDK sends none today, so this pins that. */
  public send(data: string): void {
    this.sent.push(data);
  }

  public close(): void {
    this.closed = true;
    this.onclose?.({});
  }
}

/** The socket most recently constructed, i.e. the one currently in use. */
export function latestWebSocket(): MockWebSocket {
  const socket = MockWebSocket.instances.at(-1);
  if (socket === undefined) {
    throw new Error("no WebSocket was constructed");
  }
  return socket;
}

/**
 * Installs the mock and clears any instances a previous test created.
 *
 * Returns the restore function; call it in afterEach so a suite cannot leave a
 * patched global behind for the next one.
 */
export function installMockWebSocket(): () => void {
  const original = (globalThis as { WebSocket?: unknown }).WebSocket;
  MockWebSocket.instances = [];
  (globalThis as { WebSocket?: unknown }).WebSocket = MockWebSocket;

  return () => {
    (globalThis as { WebSocket?: unknown }).WebSocket = original;
    MockWebSocket.instances = [];
  };
}

/**
 * A finalization frame from the observer -- the only node type the SDK acts on.
 *
 * `cost` is a string on the wire and a bigint after parsing, which is exactly
 * the coercion the event schema exists to perform, so it is spelled as the wire
 * shape here rather than pre-parsed.
 */
export function observerEvent(deployId: string, cost = "100", errored = false) {
  return JSON.stringify({
    cost,
    deploy_id: deployId,
    errored,
    node_type: "Observer",
    type: "Finalized",
  });
}

/**
 * A finalization frame from a validator, which the SDK must ignore.
 *
 * A validator has only decided to include the deploy; the observer is what
 * confirms it is finalized and readable. Tests emit both to prove the filter
 * still discriminates.
 */
export function validatorEvent(deployId: string, cost = "50") {
  return JSON.stringify({
    cost,
    deploy_id: deployId,
    errored: false,
    node_type: "Validator",
    type: "Finalized",
  });
}
