import { base16 } from "@scure/base";

import type { HTTPHeaders } from "@/api-client";
import type {
  ContractCallConfig,
  QueryCallConfig,
} from "@/entities/HttpCallConfigs";

import { Configuration, WalletsApi } from "@/api-client";
import { signContract } from "@/functions";

import type { Address } from "../entities/Address";
import type { Amount } from "../entities/Amount";
import type { Description } from "../entities/Description";
import type { PrivateKey } from "../entities/PrivateKey";
import type { EmbersEvents } from "./EmbersEvents";

export type WalletConfig = {
  basePath: string;
  headers?: HTTPHeaders;
  privateKey: PrivateKey;
};

export class WalletsApiSdk {
  private client: WalletsApi;
  private privateKey: PrivateKey;
  public readonly address: Address;

  public constructor(
    config: WalletConfig,
    private events: EmbersEvents,
  ) {
    this.privateKey = config.privateKey;

    const configuration = new Configuration({
      basePath: config.basePath,
      headers: config.headers,
    });

    this.client = new WalletsApi(configuration);
    this.address = this.privateKey.getPublicKey().getAddress();
  }

  /**
   * Send tokens to another wallet.
   * @param to Recipient address
   * @param amount Amount to send
   * @param description Description of the transaction
   * @returns A promise that resolves when the transfer is sent.
   */
  public async sendTokens(
    to: Address,
    amount: Amount,
    description?: Description,
    config?: ContractCallConfig,
  ) {
    const prepareModel = await this.client.apiWalletsTransferPreparePost(
      {
        transferReq: {
          amount: amount.value,
          description: description?.value,
          from: this.address,
          to,
        },
      },
      { signal: config?.signal },
    );

    const signedContract = signContract(prepareModel.contract, this.privateKey);
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(signedContract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? 15_000,
    );

    const sendModel = await this.client.apiWalletsTransferSendPost(
      {
        signedContract,
      },
      { signal: config?.signal },
    );

    return { prepareModel, sendModel, waitForFinalization };
  }

  /**
   * Get the state of the wallet.
   * @returns A promise that resolves with the wallet state.
   */
  public async getState(config?: QueryCallConfig) {
    return this.client.apiWalletsAddressStateGet(
      {
        address: this.address,
      },
      { signal: config?.signal },
    );
  }
}
