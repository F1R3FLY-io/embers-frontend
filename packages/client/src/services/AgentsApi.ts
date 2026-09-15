import { base16 } from "@scure/base";

import type {
  CreateAgentReq,
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

import { AIAgentsApi, Configuration } from "../api-client";
import { apiErrorMiddleware } from "../apiErrors";
import { signContract } from "../functions";
import { DEFAULT_MAX_WAIT_FOR_FINALISATION } from "./EmbersEvents";

export type AiAgentConfig = {
  basePath: string;
  fetchApi?: FetchAPI;
  headers?: HTTPHeaders;
  middleware?: Middleware[];
  privateKey: PrivateKey;
};

/**
 * A facade for interacting with AI agents on the blockchain.
 * Provides methods for creating, deploying, and managing AI agents.
 */
export class AgentsApiSdk {
  private client: AIAgentsApi;
  private privateKey: PrivateKey;
  public readonly address: Address;

  public constructor(
    config: AiAgentConfig,
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
    this.client = new AIAgentsApi(configuration);
  }

  /**
   * Creates a new AI agent.
   * @param createAgentReq The agent creation request
   * @return Promise with Agent entity or reject with error
   */
  public async create(
    createAgentReq: CreateAgentReq,
    config?: ContractCallConfig,
  ) {
    const prepareResponse = await this.client.agentsPrepareCreate(
      {
        createAgentReq,
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

    const sendResponse = await this.client.agentsSendCreate(
      {
        sendRequestBodySignedContractCreateAgentReqCreateAgentResp: {
          prepareRequest: createAgentReq,
          prepareResponse: prepareResponse.response,
          request: signedContract,
          token: prepareResponse.token,
        },
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse, waitForFinalization };
  }

  public async deployCode(code: string, config?: ContractCallConfig) {
    const prepareRequest = {
      code,
      type: "Code" as const,
    };

    const prepareResponse = await this.client.agentsPrepareDeploy(
      {
        deployAgentReq: prepareRequest,
      },
      { signal: config?.signal },
    );

    const contract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );
    const system =
      prepareResponse.response.system &&
      signContract(prepareResponse.response.system, this.privateKey);
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(contract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? DEFAULT_MAX_WAIT_FOR_FINALISATION,
    );

    const sendResponse = await this.client.agentsSendDeploy(
      {
        sendRequestBodyDeploySignedAgentReqDeployAgentReqDeployAgentResp: {
          prepareRequest,
          prepareResponse: prepareResponse.response,
          request: { contract, system },
          token: prepareResponse.token,
        },
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse, waitForFinalization };
  }

  /**
   * Deploys an AI agent version.
   * @param id The ID of the agent
   * @param version The version to deploy
   */
  public async deploy(
    id: string,
    version: string,
    config?: ContractCallConfig,
  ) {
    const prepareRequest = {
      address: this.address,
      id,
      type: "Agent" as const,
      version,
    };

    const prepareResponse = await this.client.agentsPrepareDeploy(
      {
        deployAgentReq: prepareRequest,
      },
      { signal: config?.signal },
    );

    const contract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );
    const system =
      prepareResponse.response.system &&
      signContract(prepareResponse.response.system, this.privateKey);
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(contract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? DEFAULT_MAX_WAIT_FOR_FINALISATION,
    );

    const sendResponse = await this.client.agentsSendDeploy(
      {
        sendRequestBodyDeploySignedAgentReqDeployAgentReqDeployAgentResp: {
          prepareRequest,
          prepareResponse: prepareResponse.response,
          request: { contract, system },
          token: prepareResponse.token,
        },
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse, waitForFinalization };
  }

  /**
   * Gets all agents owned by the current address.
   */
  public async get(config?: QueryCallConfig) {
    return this.client.agentsList(
      {
        address: this.address,
      },
      { signal: config?.signal },
    );
  }

  /**
   * Gets a specific agent version.
   * @param id The ID of the agent
   * @param version The version to retrieve
   */
  public async getVersion(
    id: string,
    version: string,
    config?: QueryCallConfig,
  ) {
    return this.client.agentsGetVersion(
      {
        address: this.address,
        id,
        version,
      },
      { signal: config?.signal },
    );
  }

  /**
   * Gets all versions of a specific agent.
   * @param id The ID of the agent
   */
  public async getVersions(id: string, config?: QueryCallConfig) {
    return this.client.agentsListVersions(
      {
        address: this.address,
        id,
      },
      { signal: config?.signal },
    );
  }

  /**
   * Saves a new version of an existing agent.
   * @param id The ID of the agent
   * @param agentReq The agent update request
   * @return Promise with Agent entity or reject with error
   */
  public async save(
    id: string,
    agentReq: CreateAgentReq,
    config?: ContractCallConfig,
  ) {
    const prepareResponse = await this.client.agentsPrepareSave(
      {
        createAgentReq: agentReq,
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

    const sendResponse = await this.client.agentsSendSave(
      {
        id,
        sendRequestBodySignedContractCreateAgentReqSaveAgentResp: {
          prepareRequest: agentReq,
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
    const prepareResponse = await this.client.agentsPrepareDelete(
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

    const sendResponse = await this.client.agentsSendDelete(
      {
        id,
        signedContract,
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse, waitForFinalization };
  }
}
