import { base16 } from "@scure/base";

import type { CreateOslfReq, HTTPHeaders } from "@/api-client";
import type {
  ContractCallConfig,
  QueryCallConfig,
} from "@/entities/HttpCallConfigs";

import { Configuration, OslfApi } from "@/api-client";
import { signContract } from "@/functions";

import type { Address } from "../entities/Address";
import type { PrivateKey } from "../entities/PrivateKey";
import type { EmbersEvents } from "./EmbersEvents";

export type OslfConfig = {
  basePath: string;
  headers?: HTTPHeaders;
  privateKey: PrivateKey;
};

export class OslfApiSdk {
  private client: OslfApi;
  private privateKey: PrivateKey;
  public readonly address: Address;

  public constructor(
    config: OslfConfig,
    private events: EmbersEvents,
  ) {
    this.privateKey = config.privateKey;
    this.address = this.privateKey.getPublicKey().getAddress();

    const configuration = new Configuration({
      basePath: config.basePath,
      headers: config.headers,
    });

    this.client = new OslfApi(configuration);
  }

  public async create(
    createOslfReq: CreateOslfReq,
    config?: ContractCallConfig,
  ) {
    const prepareResponse = await this.client.apiOslfCreatePreparePost(
      {
        createOslfReq,
      },
      { signal: config?.signal },
    );

    const signedContract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(signedContract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? 15_000,
    );

    const sendResponse = await this.client.apiOslfCreateSendPost(
      {
        sendRequestBodySignedContractCreateOslfReqCreateOslfResp: {
          prepareRequest: createOslfReq,
          prepareResponse: prepareResponse.response,
          request: signedContract,
          token: prepareResponse.token,
        },
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse, waitForFinalization };
  }

  public async get(config?: QueryCallConfig) {
    return this.client.apiOslfAddressGet(
      {
        address: this.address,
      },
      { signal: config?.signal },
    );
  }

  public async getVersion(
    id: string,
    version: string,
    config?: QueryCallConfig,
  ) {
    return this.client.apiOslfAddressIdVersionsVersionGet(
      {
        address: this.address,
        id,
        version,
      },
      { signal: config?.signal },
    );
  }

  public async getVersions(id: string, config?: QueryCallConfig) {
    return this.client.apiOslfAddressIdVersionsGet(
      {
        address: this.address,
        id,
      },
      { signal: config?.signal },
    );
  }

  public async save(
    id: string,
    oslfReq: CreateOslfReq,
    config?: ContractCallConfig,
  ) {
    const prepareResponse = await this.client.apiOslfIdSavePreparePost(
      {
        createOslfReq: oslfReq,
        id,
      },
      { signal: config?.signal },
    );

    const signedContract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(signedContract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? 15_000,
    );

    const sendResponse = await this.client.apiOslfIdSaveSendPost(
      {
        id,
        sendRequestBodySignedContractCreateOslfReqSaveOslfResp: {
          prepareRequest: oslfReq,
          prepareResponse: prepareResponse.response,
          request: signedContract,
          token: prepareResponse.token,
        },
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse, waitForFinalization };
  }

  public async delete(id: string, config?: ContractCallConfig) {
    const prepareResponse = await this.client.apiOslfIdDeletePreparePost(
      {
        id,
      },
      { signal: config?.signal },
    );

    const signedContract = signContract(
      prepareResponse.contract,
      this.privateKey,
    );
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(signedContract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? 15_000,
    );

    const sendResponse = await this.client.apiOslfIdDeleteSendPost(
      {
        id,
        signedContract,
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse, waitForFinalization };
  }
}
