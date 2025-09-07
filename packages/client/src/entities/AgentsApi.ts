import type {
  Agents,
  CreateAgentReq,
  HTTPHeaders,
  SignedContract,
} from "../api-client";
import type { Address } from "./Address";

import { AIAgentsApi, Configuration } from "../api-client";
import { deployContract, sign } from "../functions";
import { PrivateKey } from "./PrivateKey";

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

  /**
   * Deploys an AI agent version.
   * @param agentId The ID of the agent
   * @param version The version to deploy
   */
  public async deployAgent(agentId: string, version: string) {
    // Get the contract and sign it
    const contract = async () =>
      this.client.apiAiAgentsAddressIdVersionsVersionDeployPreparePost({
        address: this.address.value,
        id: agentId,
        version,
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

      return this.client.apiAiAgentsAddressIdVersionsVersionDeploySendPost({
        address: this.address.value,
        id: agentId,
        signedContract,
        version,
      });
    };

    await deployContract(this.privateKey, contract, sendContract);
  }

  /**
   * Gets all agents owned by the current address.
   */
  public async getAgents(): Promise<Agents> {
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

  /**
   * Deploys an AI agent test.
   * @param testKey The private key for testnet
   * @param test The testcase
   * @param env The code that being tested
   */
  public async testDeployAgent(
    testKey: PrivateKey,
    test: string,
    env?: string,
  ) {
    const response = await this.client.apiAiAgentsTestDeployPreparePost({
      deployTestReq: {
        env,
        test,
      },
    });

    const signedTestContract = sign(response.testContract, testKey);
    const signedEnvContract =
      response.envContract && sign(response.envContract, testKey);

    return this.client.apiAiAgentsTestDeploySendPost({
      deploySignedTestReq: {
        env: signedEnvContract && {
          contract: response.envContract!,
          deployer: this.privateKey.getPublicKey().value,
          sig: signedEnvContract.sig,
          sigAlgorithm: signedEnvContract.sigAlgorithm,
        },
        test: {
          contract: response.testContract,
          deployer: this.privateKey.getPublicKey().value,
          sig: signedTestContract.sig,
          sigAlgorithm: signedTestContract.sigAlgorithm,
        },
      },
    });
  }

  /**
   * Generate new test wallet private key
   * @returns Wallet key
   */
  public async getTestWalletKey() {
    const { key } = await this.client.apiAiAgentsTestWalletPost();
    return PrivateKey.tryFromHex(key);
  }
}
