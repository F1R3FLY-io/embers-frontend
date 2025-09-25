import type { Graph } from "@f1r3fly-io/graphl-parser";

import type {
  CreateAgentsTeamReq,
  HTTPHeaders,
  SignedContract,
} from "@/api-client";

import { AIAgentsTeamsApi, Configuration } from "@/api-client";
import { deployContract } from "@/functions";

import type { Address } from "./Address";
import type { Amount } from "./Amount";
import type { PrivateKey } from "./PrivateKey";

export type AgentsTeamsConfig = {
  basePath: string;
  headers?: HTTPHeaders;
  privateKey: PrivateKey;
};

export class AgentsTeamsApiSdk {
  private client: AIAgentsTeamsApi;

  public readonly privateKey: PrivateKey;
  public readonly address: Address;

  public constructor(config: AgentsTeamsConfig) {
    this.privateKey = config.privateKey;
    this.address = this.privateKey.getPublicKey().getAddress();

    const configuration = new Configuration({
      basePath: config.basePath,
      headers: config.headers,
    });
    this.client = new AIAgentsTeamsApi(configuration);
  }

  public async createAgentsTeam(createAgentsTeamReq: CreateAgentsTeamReq) {
    const prepareContract = async () =>
      this.client.apiAiAgentsTeamsCreatePreparePost({
        createAgentsTeamReq,
      });

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

      return this.client.apiAiAgentsTeamsCreateSendPost({ signedContract });
    };

    return deployContract(this.privateKey, prepareContract, sendContract).then(
      (result) => {
        const { contract: _, ...rest } = result.generateModel;
        return rest;
      },
    );
  }

  public async getAgentsTeams() {
    return this.client.apiAiAgentsTeamsAddressGet({
      address: this.address,
    });
  }

  public async getAgentsTeamVersion(id: string, version: string) {
    return this.client.apiAiAgentsTeamsAddressIdVersionsVersionGet({
      address: this.address,
      id,
      version,
    });
  }

  public async getAgentsTeamVersions(id: string) {
    return this.client.apiAiAgentsTeamsAddressIdVersionsGet({
      address: this.address,
      id,
    });
  }

  public async deployGraph(graph: Graph, phloLimit: Amount) {
    const contract = async () =>
      this.client.apiAiAgentsTeamsDeployPreparePost({
        deployAgentsTeamReq: {
          graph,
          phloLimit: phloLimit.value,
          type: "Graph",
        },
      });

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

      return this.client.apiAiAgentsTeamsDeploySendPost({
        signedContract,
      });
    };

    await deployContract(this.privateKey, contract, sendContract);
  }

  public async deployAgetnsTeam(
    id: string,
    version: string,
    phloLimit: Amount,
  ) {
    const contract = async () =>
      this.client.apiAiAgentsTeamsDeployPreparePost({
        deployAgentsTeamReq: {
          address: this.address,
          id,
          phloLimit: phloLimit.value,
          type: "AgentsTeam",
          version,
        },
      });

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

      return this.client.apiAiAgentsTeamsDeploySendPost({
        signedContract,
      });
    };

    await deployContract(this.privateKey, contract, sendContract);
  }

  public async saveAgentsTeamVersion(
    id: string,
    createAgentsTeamReq: CreateAgentsTeamReq,
  ) {
    const generateContract = async () =>
      this.client.apiAiAgentsTeamsIdSavePreparePost({
        createAgentsTeamReq,
        id,
      });

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

      return this.client.apiAiAgentsTeamsIdSaveSendPost({
        id,
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
