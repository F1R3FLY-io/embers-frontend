import type { HTTPHeaders } from "@/api-client";
import type { PrivateKey } from "@/entities/PrivateKey";

import { AgentsApiSdk } from "./AgentsApi";
import { AgentsTeamsApiSdk } from "./AgentsTeamsApi";
import { EmbersEvents } from "./EmbersEvents";
import { OslfsApiSdk } from "./OslfsApi";
import { TestnetApiSdk } from "./TestnetApi";
import { WalletsApiSdk } from "./WalletsApi";

export type EmbersConfig = {
  basePath: string;
  headers?: HTTPHeaders;
  privateKey: PrivateKey;
};

export class EmbersApiSdk {
  public readonly events: EmbersEvents;
  public readonly agents: AgentsApiSdk;
  public readonly agentsTeams: AgentsTeamsApiSdk;
  public readonly oslfs: OslfsApiSdk;
  public readonly wallets: WalletsApiSdk;
  public readonly testnet: TestnetApiSdk;

  public constructor(config: EmbersConfig) {
    this.events = new EmbersEvents({
      address: config.privateKey.getPublicKey().getAddress(),
      basePath: config.basePath,
    });

    this.agents = new AgentsApiSdk(config, this.events);
    this.agentsTeams = new AgentsTeamsApiSdk(config, this.events);
    this.oslfs = new OslfsApiSdk(config, this.events);
    this.wallets = new WalletsApiSdk(config, this.events);
    this.testnet = new TestnetApiSdk(config);
  }
}
