import type { Address } from "@/entities/Address";

export type EmbersEventsConfig = {
  address: Address;
  basePath: string;
};

export type DeployStatus = {
  found: boolean;
  block_hash: string | null;
  finalized: boolean;
};

export class EmbersEvents {
  private basePath: string;
  private address: Address;

  public constructor(config: EmbersEventsConfig) {
    this.basePath = config.basePath;
    this.address = config.address;
  }

  /**
   * Wait for a deploy to be finalized by polling the HTTP status endpoint.
   * Rejects if the deploy is not finalized within maxWait ms.
   */
  public async subscribeForDeploy(
    deployId: string,
    maxWait: number,
  ): Promise<void> {
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
            return;
          }
        }
      } catch {
        // Network error — retry
      }
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Deploy ${deployId} not finalized after ${maxWait}ms`);
  }
}
