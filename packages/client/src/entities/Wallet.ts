import type { HTTPHeaders } from "../api-client";
import type { GetContractCallback, TransferTokensCallback } from "../functions";
import type { Address } from "./Address";
import type { Amount } from "./Amount";
import type { Description } from "./Description";
import type { PrivateKey } from "./PrivateKey";

import { Configuration, WalletsApi } from "../api-client";
import {
  generateAddressFrom,
  getWalletState,
  transferTokens as transferTokens,
} from "../functions";

export type WalletConfig = {
  headers: HTTPHeaders;
  host: string;
  port: number;
  privateKey: PrivateKey;
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
    const preparePostCallback: GetContractCallback = ({
      amount,
      description,
      from,
      to,
    }) =>
      this.client.apiWalletsTransferPreparePost({
        transferReq: {
          amount: amount.getValue().toString(),
          description: description.getValue(),
          from: from.getValue(),
          to: to.getValue(),
        },
      });

    const transferSendCallback: TransferTokensCallback = ({
      contract,
      sig,
      sigAlgorithm,
    }) =>
      this.client.apiWalletsTransferSendPost({
        signedContract: {
          contract: Array.from(contract),
          deployer: Array.from(this.privateKey.getPublicKey().getValue()),
          sig: Array.from(sig),
          sigAlgorithm,
        },
      });

    return transferTokens(
      this.privateKey,
      to,
      amount,
      description,
      preparePostCallback,
      transferSendCallback,
    );
  }

  /**
   * Get the state of the wallet.
   * @returns A promise that resolves with the wallet state.
   */
  async getWalletState() {
    return getWalletState(this.address, this.client);
  }
}
