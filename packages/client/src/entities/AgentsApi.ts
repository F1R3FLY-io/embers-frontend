import type {
  CreateAgentReq,
  HTTPHeaders,
  SignedContract,
} from "../api-client";
import type { Address } from "./Address";
import type { Amount } from "./Amount";
import type { PrivateKey } from "./PrivateKey";

import { AIAgentsApi, Configuration } from "../api-client";
import { deployContract } from "../functions";

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
   * @param agentReq The agent creation request
   * @return Promise with Agent entity or reject with error
   */
  public async createAgent(agentReq: CreateAgentReq) {
    // First prepare the contract for creating an agent
    const prepareContract = async () =>
      this.client.apiAiAgentsCreatePreparePost({
        createAgentReq: agentReq,
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

    return deployContract(this.privateKey, prepareContract, sendContract).then(
      (result) => {
        const { contract: _, ...rest } = result.generateModel;
        return rest;
      },
    );
  }

  public async deployCode(code: string, phloLimit: Amount) {
    const contract = async () =>
      this.client.apiAiAgentsDeployPreparePost({
        deployAgentReq: {
          code,
          phloLimit: phloLimit.value,
          type: "Code",
        },
      });

    // Send the signed contract
    const sendContract = async (
      contract: Uint8Array,
      sig: Uint8Array,
      sigAlgorithm: string,
    ) => {
      const signedContract: SignedContract = {
        contract,
        deployer: this.privateKey.getPublicKey().value,
        sig,
        sigAlgorithm,
      };

      return this.client.apiAiAgentsDeploySendPost({
        signedContract,
      });
    };

    await deployContract(this.privateKey, contract, sendContract);
  }

  /**
   * Deploys an AI agent version.
   * @param agentId The ID of the agent
   * @param version The version to deploy
   */
  public async deployAgent(
    agentId: string,
    version: string,
    phloLimit: Amount,
  ) {
    // Get the contract and sign it
    const contract = async () =>
      this.client.apiAiAgentsDeployPreparePost({
        deployAgentReq: {
          address: this.address.value,
          id: agentId,
          phloLimit: phloLimit.value,
          type: "Agent",
          version,
        },
      });

    // Send the signed contract
    const sendContract = async (
      contract: Uint8Array,
      sig: Uint8Array,
      sigAlgorithm: string,
    ) => {
      const signedContract: SignedContract = {
        contract,
        deployer: this.privateKey.getPublicKey().value,
        sig,
        sigAlgorithm,
      };

      return this.client.apiAiAgentsDeploySendPost({
        signedContract,
      });
    };

    await deployContract(this.privateKey, contract, sendContract);
  }

  /**
   * Gets all agents owned by the current address.
   */
  public async getAgents() {
    return this.client.apiAiAgentsAddressGet({
      address: this.address.value,
    });
  }

  /**
   * Gets a specific agent version.
   * @param agentId The ID of the agent
   * @param version The version to retrieve
   */
  public async getAgentVersion(agentId: string, version: string) {
    return this.client.apiAiAgentsAddressIdVersionsVersionGet({
      address: this.address.value,
      id: agentId,
      version,
    });
  }

  /**
   * Gets all versions of a specific agent.
   * @param agentId The ID of the agent
   */
  public async getAgentVersions(agentId: string) {
    return this.client.apiAiAgentsAddressIdVersionsGet({
      address: this.address.value,
      id: agentId,
    });
  }

  /**
   * Saves a new version of an existing agent.
   * @param agentId The ID of the agent
   * @param agentReq The agent update request
   * @return Promise with Agent entity or reject with error
   */
  public async saveAgentVersion(agentId: string, agentReq: CreateAgentReq) {
    const generateContract = async () =>
      this.client.apiAiAgentsIdSavePreparePost({
        createAgentReq: agentReq,
        id: agentId,
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
        id: agentId,
        signedContract,
      });
    };

    return deployContract(this.privateKey, generateContract, sendContract).then(
      (result) => {
        const { contract: _, ...rest } = result.generateModel;
        return rest;
      },
    );
  }
}
