import { z } from "zod/mini";

import type { Address } from "../entities/Address";

export type EmbersEventsConfig = {
  address: Address;
  basePath: string;
};

/** The node kinds that report finalization. */
export const NodeType = z.enum(["Validator", "Observer"]);
export type NodeType = z.infer<typeof NodeType>;

export const WalletEvent = z.discriminatedUnion("type", [
  z.object({
    /** Execution cost charged to the deployer; coerced from the wire's string. */
    cost: z.coerce.bigint(),
    /** The finalized deploy — equal to the `deploy_id` send returned. */
    deploy_id: z.string(),
    /**
     * True when the deploy finalized but its execution failed on chain (for
     * example, insufficient funds at execution).
     */
    errored: z.boolean(),
    /** Which node reports; the SDK acts only on `Observer`. */
    node_type: NodeType,
    /** Discriminator. */
    type: z.literal("Finalized"),
  }),
]);
export type WalletEvent = z.infer<typeof WalletEvent>;

/**
 * Default time (ms) to wait for a deploy's finalization confirmation.
 *
 * Confirmation arrives only once the OBSERVER node reports the deploy
 * finalized (handleMessage below), so this budget must absorb observer lag
 * behind the validator, not just consensus finality. It matches the
 * backend's own implicit deploy-finalization budget
 * (EMBERS__FINALIZATION__DEPLOY_TIMEOUT_MILLIS, default 120000): a client
 * that gives up sooner than the server reports failure for deploys the
 * server still considers in progress -- and that already land on chain.
 */
export const DEFAULT_MAX_WAIT_FOR_FINALISATION = 120_000;

/** What a pending finalization wait needs in order to be settled or abandoned. */
type DeployWait = {
  reject: (reason: Error) => void;
  resolve: () => void;
  timeout: ReturnType<typeof setTimeout>;
};

export class EmbersEvents {
  private ws!: WebSocket;
  private deploySubscriptions: Map<string, DeployWait> = new Map();
  private subscribers: Map<number, (e: WalletEvent) => void> = new Map();
  private config: EmbersEventsConfig;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private closed = false;

  public constructor(config: EmbersEventsConfig) {
    this.config = config;
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(
      `${this.config.basePath}/api/wallets/${this.config.address.toString()}/deploys`,
    );
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onopen = () => {
      this.reconnectDelay = 1000; // reset backoff on successful connect
    };
    this.ws.onclose = () => this.scheduleReconnect();
    this.ws.onerror = () => {}; // onclose fires after onerror
  }

  private scheduleReconnect() {
    // A closed stream stays closed. Without this, `close()` would be undone by
    // the `onclose` it causes, and the reconnect loop would run forever.
    if (this.closed) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2,
      this.maxReconnectDelay,
    );
  }

  /**
   * Stops the stream: no socket, no reconnect, no pending waits.
   *
   * Without this the class could only be abandoned, never shut down. The socket
   * reconnects on every close, so dropping the last reference leaves a timer
   * chain resurrecting a connection forever -- fine in a browser tab that is
   * about to be discarded, but in Node it keeps the event loop alive and the
   * process never exits. That is why the repository's own seed script has to
   * call `process.exit(0)`, and why a test suite cannot finish cleanly.
   *
   * Handlers are detached before closing, because `onclose` is what schedules
   * the reconnect and it would otherwise fire during shutdown.
   *
   * Pending finalization waits are rejected rather than left hanging. A caller
   * who closes the stream has given up on hearing back, and a promise that can
   * now never settle would strand whatever awaits it; the rejection says the
   * deploy may still have finalized, which is exactly the honest reading -- the
   * deploy was accepted, only the listening stopped.
   *
   * Idempotent: closing an already-closed stream does nothing.
   */
  public close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;

    if (this.reconnectTimer !== undefined) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    this.ws.onclose = null;
    this.ws.onerror = null;
    this.ws.onmessage = null;
    this.ws.onopen = null;
    this.ws.close();

    const waits = [...this.deploySubscriptions.entries()];
    this.deploySubscriptions.clear();
    for (const [deployId, wait] of waits) {
      clearTimeout(wait.timeout);
      wait.reject(
        new Error(
          `deploy ${deployId} was accepted but the event stream was closed ` +
            `before its finalization was confirmed; the deploy may still ` +
            `finalize -- verify the record before retrying`,
        ),
      );
    }

    this.subscribers.clear();
  }

  private handleMessage(event: MessageEvent<string>) {
    const walletEvent = WalletEvent.parse(JSON.parse(event.data));
    if (walletEvent.node_type === "Observer") {
      const wait = this.deploySubscriptions.get(walletEvent.deploy_id);
      if (wait !== undefined) {
        clearTimeout(wait.timeout);
        this.deploySubscriptions.delete(walletEvent.deploy_id);

        // `errored` means the deploy finalized but its execution FAILED on
        // chain -- insufficient funds at execution time, a contract that threw.
        // Resolving here would be the worst possible answer: the caller awaits
        // finalization precisely to learn whether the work happened, and every
        // caller treats a resolved wait as success. The record would be
        // reported as saved, deployed, or transferred while nothing changed.
        // Rejecting says what happened and, unlike the timeout case, says the
        // opposite about retrying: the deploy is settled and did not take
        // effect, so retrying is the correct response rather than a duplicate.
        if (walletEvent.errored) {
          wait.reject(
            new Error(
              `deploy ${walletEvent.deploy_id} finalized but its execution ` +
                `failed on chain; nothing was recorded, so the operation can ` +
                `be retried`,
            ),
          );
        } else {
          wait.resolve();
        }
      }
      this.subscribers.forEach((sub) => sub(walletEvent));
    }
  }

  public async subscribeForDeploy(
    deployId: string,
    maxWait: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.deploySubscriptions.delete(deployId);
        // The deploy was already accepted by send; only the observer's
        // confirmation is missing. Say so: a bare "timeout" reads as total
        // failure and invites a retry that duplicates the record.
        reject(
          new Error(
            `deploy ${deployId} was accepted but its observer finalization ` +
              `confirmation timed out after ${String(maxWait)}ms; the deploy ` +
              `may still finalize -- verify the record before retrying`,
          ),
        );
      }, maxWait);

      this.deploySubscriptions.set(deployId, {
        reject,
        resolve: () => resolve(undefined),
        timeout,
      });
    });
  }

  public subscribe(sub: (e: WalletEvent) => void): number {
    const id = Math.random();
    this.subscribers.set(id, sub);
    return id;
  }

  public unsubscribe(id: number) {
    this.subscribers.delete(id);
  }
}
