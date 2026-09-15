import { base16 } from "@scure/base";

import type { FetchAPI, HTTPHeaders, Middleware } from "../api-client";
import type { Address } from "../entities/Address";
import type { Amount } from "../entities/Amount";
import type {
  ContractCallConfig,
  QueryCallConfig,
} from "../entities/HttpCallConfigs";
import type { PrivateKey } from "../entities/PrivateKey";
import type { EmbersEvents } from "./EmbersEvents";

import { Configuration, WalletsApi } from "../api-client";
import { apiErrorMiddleware } from "../apiErrors";
import { signContract } from "../functions";
import { DEFAULT_MAX_WAIT_FOR_FINALISATION } from "./EmbersEvents";

export type WalletConfig = {
  basePath: string;
  fetchApi?: FetchAPI;
  headers?: HTTPHeaders;
  middleware?: Middleware[];
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
    this.address = this.privateKey.getPublicKey().getAddress();

    const configuration = new Configuration({
      basePath: config.basePath,
      fetchApi: config.fetchApi,
      headers: config.headers,
      middleware: [...(config.middleware ?? []), apiErrorMiddleware],
    });

    this.client = new WalletsApi(configuration);
  }

  /**
   * Send tokens to another wallet.
   * @param to Recipient address
   * @param amount Amount to send
   * @param description Description of the transaction
   * @returns A promise that resolves when the transfer is sent.
   */
  public async transfer(
    to: Address,
    amount: Amount,
    description?: string,
    config?: ContractCallConfig,
  ) {
    const prepareRequest = {
      amount: amount.value,
      description,
      from: this.address,
      to,
    };

    const prepareResponse = await this.client.walletsPrepareTransfer(
      {
        transferReq: prepareRequest,
      },
      { signal: config?.signal },
    );

    const signedContract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(signedContract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? DEFAULT_MAX_WAIT_FOR_FINALISATION,
    );

    const sendResponse = await this.client.walletsSendTransfer(
      {
        sendRequestBodySignedContractTransferReqTransferResp: {
          prepareRequest,
          prepareResponse: prepareResponse.response,
          request: signedContract,
          token: prepareResponse.token,
        },
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse, waitForFinalization };
  }

  public async boost(
    to: Address,
    amount: Amount,
    postAuthorDid: string,
    description?: string,
    postId?: string,
    config?: ContractCallConfig,
  ) {
    const prepareRequest = {
      amount: amount.value,
      description,
      from: this.address,
      postAuthorDid,
      postId,
      to,
    };

    const prepareResponse = await this.client.walletsPrepareBoost(
      {
        boostReq: prepareRequest,
      },
      { signal: config?.signal },
    );

    const signedContract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(signedContract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? DEFAULT_MAX_WAIT_FOR_FINALISATION,
    );

    const sendResponse = await this.client.walletsSendBoost(
      {
        sendRequestBodySignedContractBoostReqBoostResp: {
          prepareRequest,
          prepareResponse: prepareResponse.response,
          request: signedContract,
          token: prepareResponse.token,
        },
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse, waitForFinalization };
  }

  /**
   * Get the state of the wallet.
   * @returns A promise that resolves with the wallet state.
   */
  public async getState(config?: QueryCallConfig) {
    return this.client.walletsStateAndHistory(
      {
        address: this.address,
      },
      { signal: config?.signal },
    );
  }
}
