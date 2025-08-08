export type AgentId = string;
export type AgentVersion = string;

export const NO_VERSION: AgentId = "NO_VERSION";
export const NO_ID: AgentVersion = "NO_ID";

export class Agent {
  public constructor(
    public readonly id: AgentId,
    public readonly version: AgentVersion = NO_VERSION,
  ) {}

  public static empty() {
    return new Agent(NO_ID, NO_VERSION);
  }

  public is_empty() {
    return this.id === NO_ID && this.version === NO_VERSION;
  }

  public newWithVersion(version: AgentVersion) {
    return new Agent(this.id, version);
  }
}
