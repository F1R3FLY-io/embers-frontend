import { base16 } from "@scure/base";

import type {
  CreateOslfReq,
  FetchAPI,
  HTTPHeaders,
  Middleware,
} from "../api-client";
import type { Address } from "../entities/Address";
import type {
  ContractCallConfig,
  QueryCallConfig,
} from "../entities/HttpCallConfigs";
import type { PrivateKey } from "../entities/PrivateKey";
import type { EmbersEvents } from "./EmbersEvents";

import { Configuration, OslfsApi } from "../api-client";
import { signContract } from "../functions";
import { DEFAULT_MAX_WAIT_FOR_FINALISATION } from "./EmbersEvents";

export type OslfsConfig = {
  basePath: string;
  fetchApi?: FetchAPI;
  headers?: HTTPHeaders;
  middleware?: Middleware[];
  privateKey: PrivateKey;
};

export class OslfsApiSdk {
  private client: OslfsApi;
  private privateKey: PrivateKey;
  public readonly address: Address;

  public constructor(
    config: OslfsConfig,
    private events: EmbersEvents,
  ) {
    this.privateKey = config.privateKey;
    this.address = this.privateKey.getPublicKey().getAddress();

    const configuration = new Configuration({
      basePath: config.basePath,
      fetchApi: config.fetchApi,
      headers: config.headers,
      middleware: config.middleware,
    });

    this.client = new OslfsApi(configuration);
  }

  public async create(
    createOslfReq: CreateOslfReq,
    config?: ContractCallConfig,
  ) {
    const prepareResponse = await this.client.oslfsPrepareCreate(
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
      config?.maxWaitForFinalisation ?? DEFAULT_MAX_WAIT_FOR_FINALISATION,
    );

    const sendResponse = await this.client.oslfsSendCreate(
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
    return this.client.oslfsList(
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
    return this.client.oslfsGetVersion(
      {
        address: this.address,
        id,
        version,
      },
      { signal: config?.signal },
    );
  }

  public async getVersions(id: string, config?: QueryCallConfig) {
    return this.client.oslfsListVersions(
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
    const prepareResponse = await this.client.oslfsPrepareSave(
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
      config?.maxWaitForFinalisation ?? DEFAULT_MAX_WAIT_FOR_FINALISATION,
    );

    const sendResponse = await this.client.oslfsSendSave(
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
    const prepareResponse = await this.client.oslfsPrepareDelete(
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
      config?.maxWaitForFinalisation ?? DEFAULT_MAX_WAIT_FOR_FINALISATION,
    );

    const sendResponse = await this.client.oslfsSendDelete(
      {
        id,
        signedContract,
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse, waitForFinalization };
  }
}
