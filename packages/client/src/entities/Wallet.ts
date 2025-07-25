import { Configuration, HTTPHeaders, WalletsApi } from "../api-client";
import {
  generateAddressFrom,
  GetContractCallback,
  getWalletState,
  transferTokens as transferTokens,
  TransferTokensCallback,
} from "../functions";
import { Address } from "./Address";
import { Amount } from "./Amount";
import { Description } from "./Description";
import { PrivateKey } from "./PrivateKey";

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
          amount: Number(amount.getValue()),
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
          deployer: Array.from(this.privateKey.getPublicKeyFrom().getValue()),
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
