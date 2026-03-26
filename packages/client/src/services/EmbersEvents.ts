import type { Address } from "@/entities/Address";

export type EmbersEventsConfig = {
  address: Address;
  basePath: string;
};

export type DeployStatus = {
  found: boolean;
  block_hash: string | null;
  block_number: number | null;
  finalized: boolean;
  errored: boolean | null;
};

export class DeployError extends Error {
  constructor(public readonly deployId: string) {
    super(`Deploy ${deployId} finalized with execution error`);
    this.name = "DeployError";
  }
}

export class EmbersEvents {
  private basePath: string;
  private address: Address;

  public constructor(config: EmbersEventsConfig) {
    this.basePath = config.basePath;
    this.address = config.address;
  }

  /**
   * Wait for a deploy to be finalized by polling the HTTP status endpoint.
   * Returns the block number where the deploy was finalized.
   * Throws DeployError if the deploy finalized with an execution error.
   */
  public async subscribeForDeploy(
    deployId: string,
    maxWait: number,
  ): Promise<number> {
    const deadline = Date.now() + maxWait;
    const pollInterval = 2000;

    while (Date.now() < deadline) {
      try {
        const res = await fetch(
          `${this.basePath}/api/service/deploys/${deployId}/status`,
        );
        if (res.ok) {
          const status: DeployStatus = await res.json();
          if (status.finalized) {
            if (status.errored) {
              throw new DeployError(deployId);
            }
            return status.block_number ?? 0;
          }
        }
      } catch (err) {
        if (err instanceof DeployError) {
          throw err;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Deploy ${deployId} not finalized after ${maxWait}ms`);
  }
}
