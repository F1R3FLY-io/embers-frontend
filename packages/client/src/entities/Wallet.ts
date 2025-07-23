import { Configuration, HTTPHeaders, WalletsApi } from "../api-client";
import {
  generateAddressFrom,
  transferTokens as transferTokens,
} from "../functions";

import { Address } from "./Address";
import { Amount } from "./Amount";
import { Description } from "./Description";
import { PrivateKey } from "./PrivateKey";

export type WalletConfig = {
  host: string;
  port: number;
  privateKey: PrivateKey;
  headers: HTTPHeaders;
};

export class Wallet {
  private privateKey: PrivateKey;
  private client: WalletsApi;
  private address: Address;

  constructor(config: WalletConfig) {
    this.privateKey = config.privateKey;

    const configuration = new Configuration({
      basePath: `${config.host}:${config.port}`,
      headers: config.headers,
    });

    this.client = new WalletsApi(configuration);
    this.address = generateAddressFrom(this.privateKey);
  }

  /**
   * Send tokens to another wallet.
   * @param to Recipient address
   * @param amount Amount to send
   * @param description Description of the transaction
   * @returns A promise that resolves when the transfer is sent.
   */
  async sendTokens(to: Address, amount: Amount, description: Description) {
    return transferTokens(
      this.privateKey,
      to,
      amount,
      description,
      (args) => this.client.apiWalletsTransferPreparePost(args),
      (args) => this.client.apiWalletsTransferSendPost(args),
    );
  }

  /**
   * Get the state of the wallet.
   * @returns A promise that resolves with the wallet state.
   */
  async getWalletState() {
    return await this.client.apiWalletsAddressStateGet({
      address: this.address.getValue(),
    });
  }
}
