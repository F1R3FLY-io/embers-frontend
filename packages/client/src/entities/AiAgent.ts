import type {
  CreateAgentReq,
  HTTPHeaders,
  SignedContract,
} from "../api-client";
import type { DeployContractCallback, GetContractCallback } from "../functions";
import type { Address } from "./Address";
import type { AgentId } from "./Agent";

import { AIAgentsApi, Configuration } from "../api-client";
import { deployContract, sign } from "../functions";
import { Agent } from "./Agent";
import { PrivateKey } from "./PrivateKey";

export type AiAgentConfig = {
  basePath: string;
  headers: HTTPHeaders;
  privateKey: PrivateKey;
};

/**
 * A facade for interacting with AI agents on the blockchain.
 * Provides methods for creating, deploying, and managing AI agents.
 */
export class AiAgent {
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
   * @return Promise with Agent enitity or reject with error
   */
  public async createAgent(agentReq: CreateAgentReq) {
    let agent = Agent.empty();

    // First prepare the contract for creating an agent
    const prepareContract: GetContractCallback = async () => {
      const response = await this.client.apiAiAgentsCreatePreparePost({
        createAgentReq: agentReq,
      });

      agent = new Agent(response.id, response.version);

      return Uint8Array.from(response.contract);
    };

    const sendContract: DeployContractCallback<
      Awaited<ReturnType<typeof this.client.apiAiAgentsCreateSendPost>>
    > = async ({ contract, sig, sigAlgorithm }) => {
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
      () => agent,
    );
  }

  /**
   * Deploys an AI agent version.
   * @param agentId The ID of the agent
   * @param version The version to deploy
   */
  public async deployAgent(agentId: string, version: string) {
    // Get the contract and sign it
    const contract: GetContractCallback = async () => {
      // First prepare the contract for deployment
      const prepareResponse =
        await this.client.apiAiAgentsAddressIdVersionDeployPreparePost({
          address: this.address.value,
          id: agentId,
          version,
        });

      return Uint8Array.from(prepareResponse.contract);
    };

    // Send the signed contract
    const sendContract: DeployContractCallback<
      Awaited<
        ReturnType<typeof this.client.apiAiAgentsAddressIdVersionDeploySendPost>
      >
    > = async ({ contract, sig, sigAlgorithm }) => {
      const signedContract: SignedContract = {
        contract,
        deployer: this.privateKey.getPublicKey().value,
        sig,
        sigAlgorithm,
      };

      return this.client.apiAiAgentsAddressIdVersionDeploySendPost({
        address: this.address.value,
        id: agentId,
        signedContract,
        version,
      });
    };

    return deployContract(this.privateKey, contract, sendContract);
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
    return this.client.apiAiAgentsAddressIdVersionGet({
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
   * @return Promise with Agent enitity or reject with error
   */
  public async saveAgentVersion(agentId: AgentId, agentReq: CreateAgentReq) {
    let agent: Agent = new Agent(agentId);

    const generateContract: GetContractCallback = async () => {
      const response = await this.client.apiAiAgentsIdSavePreparePost({
        createAgentReq: agentReq,
        id: agentId,
      });

      agent = agent.newWithVersion(response.version);

      return Uint8Array.from(response.contract);
    };

    const sendContract: DeployContractCallback<
      Awaited<ReturnType<typeof this.client.apiAiAgentsIdSaveSendPost>>
    > = async ({ contract, sig, sigAlgorithm }) => {
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
      () => agent,
    );
  }

  /**
   * Deploys an AI agent version.
   * @param agentId The ID of the agent
   * @param version The version to deploy
   * @param test The testnet name
   */
  public async testDeployAgent(
    agentId: string,
    version: string,
    test: string,
    env?: string,
  ) {
    const response = await this.client.apiAiAgentsTestDeployPreparePost({
      deployTestReq: {
        env,
        test,
      },
    });

    const { key } = await this.client.apiAiAgentsTestWalletPost();

    const testPrivateKey = PrivateKey.tryFromHex(key);

    const signedTestContract = sign(response.testContract, testPrivateKey);
    const signedEnvContract =
      response.envContract && sign(response.envContract, testPrivateKey);

    return this.client.apiAiAgentsTestDeploySendPost({
      deploySignedTestReq: {
        env:
          signedEnvContract &&
          ({
            contract: response.envContract,
            deployer: this.privateKey.getPublicKey().value,
            sig: signedEnvContract.sig,
            sigAlgorithm: signedEnvContract.sigAlgorithm,
          } as SignedContract),
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
    return (await this.client.apiAiAgentsTestWalletPost()).key;
  }
}
