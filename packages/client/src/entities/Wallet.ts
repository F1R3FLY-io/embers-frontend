import { Configuration, type HTTPHeaders, WalletsApi } from "../api-client";
import {
  type GetContractCallback,
  getWalletState,
  transferTokens,
  type TransferTokensCallback,
} from "../functions";
import { type Address } from "./Address";
import { type Amount } from "./Amount";
import { type Description } from "./Description";
import { type PrivateKey } from "./PrivateKey";

export type WalletConfig = {
  basePath: string;
  headers: HTTPHeaders;
  privateKey: PrivateKey;
};

export class Wallet {
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
  public sendTokens(to: Address, amount: Amount, description: Description) {
    const preparePostCallback: GetContractCallback = ({
      amount,
      description,
      from,
      to,
    }) =>
      this.client.apiWalletsTransferPreparePost({
        transferReq: {
          amount: amount.value.toString(),
          description: description.value,
          from: from.value,
          to: to.value,
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
  public getWalletState() {
    return getWalletState(this.address, this.client);
  }
}
