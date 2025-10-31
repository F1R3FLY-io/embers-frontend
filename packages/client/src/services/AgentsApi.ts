import { base16 } from "@scure/base";

import type { CreateAgentReq, HTTPHeaders } from "@/api-client";
import type {
  ContractCallConfig,
  QueryCallConfig,
} from "@/entities/HttpCallConfigs";

import { AIAgentsApi, Configuration } from "@/api-client";
import { signContract } from "@/functions";

import type { Address } from "../entities/Address";
import type { Amount } from "../entities/Amount";
import type { PrivateKey } from "../entities/PrivateKey";
import type { EmbersEvents } from "./EmbersEvents";

export type AiAgentConfig = {
  basePath: string;
  headers?: HTTPHeaders;
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
      headers: config.headers,
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
    const prepareModel = await this.client.apiAiAgentsCreatePreparePost(
      {
        createAgentReq,
      },
      { signal: config?.signal },
    );

    const signedContract = signContract(prepareModel.contract, this.privateKey);
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(signedContract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? 15_000,
    );

    const sendModel = await this.client.apiAiAgentsCreateSendPost(
      {
        signedContract,
      },
      { signal: config?.signal },
    );

    return { prepareModel, sendModel, waitForFinalization };
  }

  public async deployCode(
    code: string,
    phloLimit: Amount,
    config?: ContractCallConfig,
  ) {
    const prepareModel = await this.client.apiAiAgentsDeployPreparePost(
      {
        deployAgentReq: {
          code,
          phloLimit: phloLimit.value,
          type: "Code",
        },
      },
      { signal: config?.signal },
    );

    const contract = signContract(prepareModel.contract, this.privateKey);
    const system =
      prepareModel.system && signContract(prepareModel.system, this.privateKey);
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(contract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? 15_000,
    );

    const sendModel = await this.client.apiAiAgentsDeploySendPost(
      {
        deploySignedAgentReq: { contract, system },
      },
      { signal: config?.signal },
    );

    return { prepareModel, sendModel, waitForFinalization };
  }

  /**
   * Deploys an AI agent version.
   * @param id The ID of the agent
   * @param version The version to deploy
   */
  public async deploy(
    id: string,
    version: string,
    phloLimit: Amount,
    config?: ContractCallConfig,
  ) {
    const prepareModel = await this.client.apiAiAgentsDeployPreparePost(
      {
        deployAgentReq: {
          address: this.address,
          id,
          phloLimit: phloLimit.value,
          type: "Agent",
          version,
        },
      },
      { signal: config?.signal },
    );

    const contract = signContract(prepareModel.contract, this.privateKey);
    const system =
      prepareModel.system && signContract(prepareModel.system, this.privateKey);
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(contract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? 15_000,
    );

    const sendModel = await this.client.apiAiAgentsDeploySendPost(
      {
        deploySignedAgentReq: { contract, system },
      },
      { signal: config?.signal },
    );

    return { prepareModel, sendModel, waitForFinalization };
  }

  /**
   * Gets all agents owned by the current address.
   */
  public async get(config?: QueryCallConfig) {
    return this.client.apiAiAgentsAddressGet(
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
    return this.client.apiAiAgentsAddressIdVersionsVersionGet(
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
    return this.client.apiAiAgentsAddressIdVersionsGet(
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
    const prepareModel = await this.client.apiAiAgentsIdSavePreparePost(
      {
        createAgentReq: agentReq,
        id,
      },
      { signal: config?.signal },
    );

    const signedContract = signContract(prepareModel.contract, this.privateKey);
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(signedContract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? 15_000,
    );

    const sendModel = await this.client.apiAiAgentsIdSaveSendPost(
      {
        id,
        signedContract,
      },
      { signal: config?.signal },
    );

    return { prepareModel, sendModel, waitForFinalization };
  }

  public async delete(id: string, config?: ContractCallConfig) {
    const prepareModel = await this.client.apiAiAgentsIdDeletePreparePost(
      {
        id,
      },
      { signal: config?.signal },
    );

    const signedContract = signContract(prepareModel.contract, this.privateKey);
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(signedContract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? 15_000,
    );

    const sendModel = await this.client.apiAiAgentsIdDeleteSendPost(
      {
        id,
        signedContract,
      },
      { signal: config?.signal },
    );

    return { prepareModel, sendModel, waitForFinalization };
  }
}
