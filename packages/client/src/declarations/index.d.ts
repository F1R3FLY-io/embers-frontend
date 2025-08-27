// Basic type declarations for @f1r3fly-io/embers-client-sdk
// Auto-generated declaration files will replace this when TypeScript issues are resolved

export interface PrivateKey {
  getPublicKey: () => string;
  serialize: () => Uint8Array;
  value: Uint8Array;
}

export const PrivateKey: {
  tryFromHex: (hex: string) => PrivateKey;
};

export function deserializeKey(data: string | Uint8Array): PrivateKey;
export function generateKey(): PrivateKey;

export interface ConfigurationInterface {
  basePath?: string;
  headers?: Record<string, string>;
  privateKey?: PrivateKey;
}

export class Configuration {
  public constructor(config?: Partial<ConfigurationInterface>);
  public readonly config: ConfigurationInterface;
}

export class AIAgentsTeamsApi {
  public constructor(config?: Configuration);
  public apiAiAgentsTeamsDeployDemoPost(req: unknown): Promise<unknown>;
  public apiAiAgentsTeamsRunDemoPost(req: unknown): Promise<unknown>;
}

export class WalletsApi {
  public constructor(config?: Configuration);
  public getWalletStateAndHistory(): Promise<unknown>;
  public sendTransaction(req: unknown): Promise<unknown>;
}

export class EmbersClient {
  public constructor(config?: Configuration);
  public getAgents(): Promise<unknown>;
  public getAgentVersions(id: string): Promise<unknown>;
  public getAgentVersion(id: string, version: string): Promise<unknown>;
  public getTestWalletKey(): Promise<unknown>;
  public createAgent(params: unknown): Promise<unknown>;
  public saveAgentVersion(id: string, params: unknown): Promise<unknown>;
  public testDeployAgent(
    testKey: PrivateKey,
    test: string,
    env?: string,
  ): Promise<unknown>;
}

// Legacy API class aliases for backwards compatibility
export class AgentsApiSdk extends EmbersClient {}

export class AgentsTeamsApiSdk extends AIAgentsTeamsApi {
  public getAgentsTeams(): Promise<unknown>;
  public getAgentsTeamVersions(id: string): Promise<unknown>;
  public getAgentsTeamVersion(id: string, version: string): Promise<unknown>;
  public createAgentsTeam(params: unknown): Promise<unknown>;
  public saveAgentsTeamVersion(id: string, params: unknown): Promise<unknown>;
}

export class WalletsApiSdk extends WalletsApi {
  public address: string;
}

// Re-export all API types
export type * from "./api-types";

// Default export
declare const embersDefault: {
  AIAgentsTeamsApi: typeof AIAgentsTeamsApi;
  Configuration: typeof Configuration;
  deserializeKey: typeof deserializeKey;
  EmbersClient: typeof EmbersClient;
  generateKey: typeof generateKey;
  PrivateKey: typeof PrivateKey;
  WalletsApi: typeof WalletsApi;
};

export default embersDefault;
