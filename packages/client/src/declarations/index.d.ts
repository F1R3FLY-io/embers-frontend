// Basic type declarations for @f1r3fly-io/embers-client-sdk
// Auto-generated declaration files will replace this when TypeScript issues are resolved

export interface PrivateKey {
  serialize(): Uint8Array;
  getPublicKey(): string;
  value: Uint8Array;
}

export const PrivateKey: {
  tryFromHex(hex: string): PrivateKey;
};

export function deserializeKey(data: string | Uint8Array): PrivateKey;
export function generateKey(): PrivateKey;

export interface Configuration {
  basePath?: string;
  headers?: Record<string, string>;
  privateKey?: PrivateKey;
}

export class Configuration {
  constructor(config?: Partial<Configuration>);
}

export class AIAgentsTeamsApi {
  constructor(config?: Configuration);
  apiAiAgentsTeamsDeployDemoPost(req: any): Promise<any>;
  apiAiAgentsTeamsRunDemoPost(req: any): Promise<any>;
}

export class WalletsApi {
  constructor(config?: Configuration);
  getWalletStateAndHistory(): Promise<any>;
  sendTransaction(req: any): Promise<any>;
}

export class EmbersClient {
  constructor(config?: Configuration);
  getAgents(): Promise<any>;
  getAgentVersions(id: string): Promise<any>;
  getAgentVersion(id: string, version: string): Promise<any>;
  getTestWalletKey(): Promise<any>;
  createAgent(params: any): Promise<any>;
  saveAgentVersion(id: string, params: any): Promise<any>;
  testDeployAgent(
    testKey: PrivateKey,
    test: string,
    env?: string,
  ): Promise<any>;
}

// Legacy API class aliases for backwards compatibility
export class AgentsApiSdk extends EmbersClient {}

export class AgentsTeamsApiSdk extends AIAgentsTeamsApi {
  getAgentsTeams(): Promise<any>;
  getAgentsTeamVersions(id: string): Promise<any>;
  getAgentsTeamVersion(id: string, version: string): Promise<any>;
  createAgentsTeam(params: any): Promise<any>;
  saveAgentsTeamVersion(id: string, params: any): Promise<any>;
}

export class WalletsApiSdk extends WalletsApi {
  address: string;
}

// Re-export all API types
export * from "./api-types";

// Default export
declare const _default: {
  PrivateKey: typeof PrivateKey;
  deserializeKey: typeof deserializeKey;
  generateKey: typeof generateKey;
  Configuration: typeof Configuration;
  AIAgentsTeamsApi: typeof AIAgentsTeamsApi;
  WalletsApi: typeof WalletsApi;
  EmbersClient: typeof EmbersClient;
};

export default _default;
