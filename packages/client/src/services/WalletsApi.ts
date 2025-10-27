import type { HTTPHeaders } from "@/api-client";

import { Configuration, WalletsApi } from "@/api-client";
import { deployContract } from "@/functions";

import type { Address } from "../entities/Address";
import type { Amount } from "../entities/Amount";
import type { Description } from "../entities/Description";
import type { PrivateKey } from "../entities/PrivateKey";

export type WalletConfig = {
  basePath: string;
  headers?: HTTPHeaders;
  privateKey: PrivateKey;
};

export class WalletsApiSdk {
  private client: WalletsApi;

  public readonly privateKey: PrivateKey;
  public readonly address: Address;

  public constructor(config: WalletConfig) {
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
  ) {
    const preparePostCallback = async () =>
      this.client.apiWalletsTransferPreparePost({
        transferReq: {
          amount: amount.value,
          description: description?.value,
          from: this.privateKey.getPublicKey().getAddress(),
          to,
        },
      });

    const transferSendCallback = async (
      contract: Uint8Array,
      sig: Uint8Array,
      sigAlgorithm: string,
    ) =>
      this.client.apiWalletsTransferSendPost({
        signedContract: {
          contract,
          deployer: this.privateKey.getPublicKey().value,
          sig,
          sigAlgorithm,
        },
      });

    await deployContract(
      this.privateKey,
      preparePostCallback,
      transferSendCallback,
    );
  }

  /**
   * Get the state of the wallet.
   * @returns A promise that resolves with the wallet state.
   */
  public async getState() {
    return this.client.apiWalletsAddressStateGet({
      address: this.address,
    });
  }
}
