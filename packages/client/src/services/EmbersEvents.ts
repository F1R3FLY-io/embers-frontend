import { z } from "zod/mini";

import type { Address } from "@/entities/Address";

export type EmbersEventsConfig = {
  address: Address;
  basePath: string;
};

export const NodeType = z.enum(["Validator", "Observer"]);
export type NodeType = z.infer<typeof NodeType>;

export const WalletEvent = z.discriminatedUnion("type", [
  z.object({
    cost: z.coerce.bigint(),
    deploy_id: z.string(),
    errored: z.boolean(),
    node_type: NodeType,
    type: z.literal("Finalized"),
  }),
]);
export type WalletEvent = z.infer<typeof WalletEvent>;

/** Default time (ms) to wait for a deploy to be finalized in a block. */
export const DEFAULT_MAX_WAIT_FOR_FINALISATION = 45_000;

export class EmbersEvents {
  private ws!: WebSocket;
  private deploySubscriptions: Map<string, () => void> = new Map();
  private subscribers: Map<number, (e: WalletEvent) => void> = new Map();
  private config: EmbersEventsConfig;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;

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
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2,
      this.maxReconnectDelay,
    );
  }

  private handleMessage(event: MessageEvent<string>) {
    const walletEvent = WalletEvent.parse(JSON.parse(event.data));
    if (walletEvent.node_type === "Observer") {
      this.deploySubscriptions.get(walletEvent.deploy_id)?.();
      this.deploySubscriptions.delete(walletEvent.deploy_id);
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
        reject(new Error("timeout"));
      }, maxWait);

      this.deploySubscriptions.set(deployId, () => {
        clearTimeout(timeout);
        resolve(undefined);
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
