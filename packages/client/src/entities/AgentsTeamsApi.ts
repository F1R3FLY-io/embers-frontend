import type { CreateAgentsTeamReq, HTTPHeaders, SignedContract } from "../api-client";
import { AIAgentsTeamsApi, Configuration } from "../api-client";
import type { Graph } from "../api-client/models/Graph";
import { deployContract } from "../functions";
import type { Address } from "./Address";
import type { PrivateKey } from "./PrivateKey";

// Temporarily disabled graph conversion until graphl-parser is available
// let graphModule: InitOutput | null = null;
// async function getGraphModule() {
//   if (graphModule === null) {
//     graphModule = await init();
//   }
//   return { astToGraphl, parseToAst };
// }

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

  public async createAgentsTeam(
    agentsTeamReq: Omit<CreateAgentsTeamReq, "graph"> & { graph?: Graph },
  ) {
    // Temporarily pass graph directly as string
    const graphCode = agentsTeamReq.graph ? JSON.stringify(agentsTeamReq.graph) : undefined;
    const prepareContract = async () =>
      this.client.apiAiAgentsTeamsCreatePreparePost({
        createAgentsTeamReq: { ...agentsTeamReq, graph: graphCode },
      });

    const sendContract = async (contract: Uint8Array, sig: Uint8Array, sigAlgorithm: string) => {
      const signedContract: SignedContract = {
        contract,
        deployer: this.privateKey.getPublicKey().value,
        sig,
        sigAlgorithm,
      };

      return this.client.apiAiAgentsTeamsCreateSendPost({ signedContract });
    };

    return deployContract(this.privateKey, prepareContract, sendContract).then((result) => {
      const { contract: _, ...rest } = result.generateModel;
      return rest;
    });
  }

  public async getAgentsTeams() {
    return this.client.apiAiAgentsTeamsAddressGet({
      address: this.address.value,
    });
  }

  public async getAgentsTeamVersion(agentsTeamId: string, version: string) {
    return this.client
      .apiAiAgentsTeamsAddressIdVersionsVersionGet({
        address: this.address.value,
        id: agentsTeamId,
        version,
      })
      .then(({ graph, ...rest }) => {
        // Temporarily return graph as-is
        const graphAst = graph !== undefined ? (JSON.parse(graph) as Graph) : undefined;
        return { ...rest, graph: graphAst };
      });
  }

  public async getAgentsTeamVersions(agentsTeamId: string) {
    return this.client.apiAiAgentsTeamsAddressIdVersionsGet({
      address: this.address.value,
      id: agentsTeamId,
    });
  }

  public async saveAgentsTeamVersion(
    agentsTeamId: string,
    agentsTeamReq: Omit<CreateAgentsTeamReq, "graph"> & { graph?: Graph },
  ) {
    // Temporarily pass graph directly as string
    const graphCode = agentsTeamReq.graph ? JSON.stringify(agentsTeamReq.graph) : undefined;
    const generateContract = async () =>
      this.client.apiAiAgentsTeamsIdSavePreparePost({
        createAgentsTeamReq: { ...agentsTeamReq, graph: graphCode },
        id: agentsTeamId,
      });

    const sendContract = async (contract: Uint8Array, sig: Uint8Array, sigAlgorithm: string) => {
      const signedContract: SignedContract = {
        contract,
        deployer: this.privateKey.getPublicKey().value,
        sig,
        sigAlgorithm,
      };

      return this.client.apiAiAgentsTeamsIdSaveSendPost({
        id: agentsTeamId,
        signedContract,
      });
    };

    return deployContract(this.privateKey, generateContract, sendContract).then((result) => {
      const { contract: _, ...rest } = result.generateModel;
      return rest;
    });
  }
}
