import { blake2b } from "blakejs";

import type { CreateAgentReq, HTTPHeaders, SignedContract } from "@/api-client";

import { AIAgentsApi, Configuration } from "@/api-client";
import { deployContract, sign } from "@/functions";

import type { Address } from "../entities/Address";
import type { Amount } from "../entities/Amount";
import type { PrivateKey } from "../entities/PrivateKey";

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

  public readonly privateKey: PrivateKey;
  public readonly address: Address;

  public constructor(config: AiAgentConfig) {
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
  public async create(createAgentReq: CreateAgentReq) {
    // First prepare the contract for creating an agent
    const prepareContract = async () =>
      this.client.apiAiAgentsCreatePreparePost({
        createAgentReq,
      });

    const sendContract = async (
      contract: Uint8Array,
      sig: Uint8Array,
      sigAlgorithm: string,
    ) => {
      // Send the signed contract
      const signedContract: SignedContract = {
        contract,
        deployer: this.privateKey.getPublicKey().value,
        sig,
        sigAlgorithm,
      };

      return this.client.apiAiAgentsCreateSendPost({ signedContract });
    };

    return deployContract(this.privateKey, prepareContract, sendContract);
  }

  public async deployCode(code: string, phloLimit: Amount) {
    const prepareModel = await this.client.apiAiAgentsDeployPreparePost({
      deployAgentReq: {
        code,
        phloLimit: phloLimit.value,
        type: "Code",
      },
    });

    const payload = blake2b(prepareModel.contract, undefined, 32);
    const { sig, sigAlgorithm } = sign(payload, this.privateKey);

    const contract = {
      contract: prepareModel.contract,
      deployer: this.privateKey.getPublicKey().value,
      sig,
      sigAlgorithm,
    };

    let system = undefined;
    if (prepareModel.system !== undefined) {
      const payload = blake2b(prepareModel.system, undefined, 32);
      const { sig, sigAlgorithm } = sign(payload, this.privateKey);

      system = {
        contract: prepareModel.system,
        deployer: this.privateKey.getPublicKey().value,
        sig,
        sigAlgorithm,
      };
    }

    const sendModel = await this.client.apiAiAgentsDeploySendPost({
      deploySignedAgentReq: { contract, system },
    });

    return { prepareModel, sendModel };
  }

  /**
   * Deploys an AI agent version.
   * @param id The ID of the agent
   * @param version The version to deploy
   */
  public async deploy(id: string, version: string, phloLimit: Amount) {
    const prepareModel = await this.client.apiAiAgentsDeployPreparePost({
      deployAgentReq: {
        address: this.address,
        id,
        phloLimit: phloLimit.value,
        type: "Agent",
        version,
      },
    });

    const payload = blake2b(prepareModel.contract, undefined, 32);
    const { sig, sigAlgorithm } = sign(payload, this.privateKey);

    const contract = {
      contract: prepareModel.contract,
      deployer: this.privateKey.getPublicKey().value,
      sig,
      sigAlgorithm,
    };

    let system = undefined;
    if (prepareModel.system !== undefined) {
      const payload = blake2b(prepareModel.system, undefined, 32);
      const { sig, sigAlgorithm } = sign(payload, this.privateKey);

      system = {
        contract: prepareModel.system,
        deployer: this.privateKey.getPublicKey().value,
        sig,
        sigAlgorithm,
      };
    }

    const sendModel = await this.client.apiAiAgentsDeploySendPost({
      deploySignedAgentReq: { contract, system },
    });

    return { prepareModel, sendModel };
  }

  /**
   * Gets all agents owned by the current address.
   */
  public async get() {
    return this.client.apiAiAgentsAddressGet({
      address: this.address,
    });
  }

  /**
   * Gets a specific agent version.
   * @param id The ID of the agent
   * @param version The version to retrieve
   */
  public async getVersion(id: string, version: string) {
    return this.client.apiAiAgentsAddressIdVersionsVersionGet({
      address: this.address,
      id,
      version,
    });
  }

  /**
   * Gets all versions of a specific agent.
   * @param id The ID of the agent
   */
  public async getVersions(id: string) {
    return this.client.apiAiAgentsAddressIdVersionsGet({
      address: this.address,
      id,
    });
  }

  /**
   * Saves a new version of an existing agent.
   * @param id The ID of the agent
   * @param agentReq The agent update request
   * @return Promise with Agent entity or reject with error
   */
  public async save(id: string, agentReq: CreateAgentReq) {
    const generateContract = async () =>
      this.client.apiAiAgentsIdSavePreparePost({
        createAgentReq: agentReq,
        id,
      });

    const sendContract = async (
      contract: Uint8Array,
      sig: Uint8Array,
      sigAlgorithm: string,
    ) => {
      // Send the signed contract
      const signedContract: SignedContract = {
        contract,
        deployer: this.privateKey.getPublicKey().value,
        sig,
        sigAlgorithm,
      };

      return this.client.apiAiAgentsIdSaveSendPost({
        id,
        signedContract,
      });
    };

    return deployContract(this.privateKey, generateContract, sendContract);
  }

  public async delete(id: string) {
    const generateContract = async () =>
      this.client.apiAiAgentsIdDeletePreparePost({
        id,
      });

    const sendContract = async (
      contract: Uint8Array,
      sig: Uint8Array,
      sigAlgorithm: string,
    ) => {
      // Send the signed contract
      const signedContract: SignedContract = {
        contract,
        deployer: this.privateKey.getPublicKey().value,
        sig,
        sigAlgorithm,
      };

      return this.client.apiAiAgentsIdDeleteSendPost({
        id,
        signedContract,
      });
    };

    return deployContract(this.privateKey, generateContract, sendContract);
  }
}
