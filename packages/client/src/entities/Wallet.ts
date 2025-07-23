import { Configuration, HTTPHeaders, WalletsApi } from "../api-client";
import { generateAddressFrom, transferMoney } from "../functions";

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
  private wallet: WalletsApi;

  constructor(config: WalletConfig) {
    this.privateKey = config.privateKey;

    const configuration = new Configuration({
      basePath: `${config.host}:${config.port}`,
      headers: config.headers,
    });

    this.wallet = new WalletsApi(configuration);
  }

  /**
   * Send money to another wallet.
   * @param to Recipient address
   * @param amount Amount to send
   * @param description Description of the transaction
   * @returns A promise that resolves when the transfer is sent.
   */
  async sendMoney(to: Address, amount: Amount, description: Description) {
    return transferMoney(
      this.privateKey,
      to,
      amount,
      description,
      (args) => this.wallet.apiWalletsTransferPreparePost(args),
      (args) => this.wallet.apiWalletsTransferSendPost(args),
    );
  }

  /**
   * Get the state of the wallet.
   * @returns A promise that resolves with the wallet state.
   */
  async getWalletState() {
    const address = generateAddressFrom(this.privateKey);

    return await this.wallet.apiWalletsAddressStateGet({
      address: address.getValue(),
    });
  }
}
