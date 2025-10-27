import type { Graph } from "@f1r3fly-io/graphl-parser";

import { blake2b } from "blakejs";

import type {
  CreateAgentsTeamReq,
  HTTPHeaders,
  SignedContract,
} from "@/api-client";

import { AIAgentsTeamsApi, Configuration } from "@/api-client";
import { deployContract, insertSignedSignature, sign } from "@/functions";

import type { Address } from "../entities/Address";
import type { Amount } from "../entities/Amount";
import type { PrivateKey } from "../entities/PrivateKey";

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

  public async create(createAgentsTeamReq: CreateAgentsTeamReq) {
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

    return deployContract(this.privateKey, prepareContract, sendContract);
  }

  public async get() {
    return this.client.apiAiAgentsTeamsAddressGet({
      address: this.address,
    });
  }

  public async getVersion(id: string, version: string) {
    return this.client.apiAiAgentsTeamsAddressIdVersionsVersionGet({
      address: this.address,
      id,
      version,
    });
  }

  public async getVersions(id: string) {
    return this.client.apiAiAgentsTeamsAddressIdVersionsGet({
      address: this.address,
      id,
    });
  }

  public async deployGraph(
    graph: Graph,
    phloLimit: Amount,
    registryVersion: bigint,
    registryKey: PrivateKey,
  ) {
    const timestamp = new Date();

    const prepareModel = await this.client.apiAiAgentsTeamsDeployPreparePost({
      deployAgentsTeamReq: {
        deploy: {
          signature: insertSignedSignature(
            registryKey,
            timestamp,
            this.privateKey.getPublicKey(),
            registryVersion,
          ),
          timestamp,
          uriPubKey: registryKey.getPublicKey(),
          version: registryVersion,
        },
        graph,
        phloLimit: phloLimit.value,
        type: "Graph",
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

    const sendModel = await this.client.apiAiAgentsTeamsDeploySendPost({
      deploySignedAgentsTeamtReq: { contract, system },
    });

    return { prepareModel, sendModel };
  }

  public async deploy(
    id: string,
    version: string,
    phloLimit: Amount,
    registryVersion: bigint,
    registryKey: PrivateKey,
  ) {
    const timestamp = new Date();

    const prepareModel = await this.client.apiAiAgentsTeamsDeployPreparePost({
      deployAgentsTeamReq: {
        address: this.address,
        deploy: {
          signature: insertSignedSignature(
            registryKey,
            timestamp,
            this.privateKey.getPublicKey(),
            registryVersion,
          ),
          timestamp,
          uriPubKey: registryKey.getPublicKey(),
          version: registryVersion,
        },
        id,
        phloLimit: phloLimit.value,
        type: "AgentsTeam",
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

    const sendModel = await this.client.apiAiAgentsTeamsDeploySendPost({
      deploySignedAgentsTeamtReq: { contract, system },
    });

    return { prepareModel, sendModel };
  }

  public async run(agentTeamUri: string, prompt: string, phloLimit: Amount) {
    const contract = async () =>
      this.client.apiAiAgentsTeamsRunPreparePost({
        runAgentsTeamReq: {
          agentsTeam: agentTeamUri,
          phloLimit: phloLimit.value,
          prompt,
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

      return this.client.apiAiAgentsTeamsRunSendPost({
        signedContract,
      }) as Promise<unknown>;
    };

    return deployContract(this.privateKey, contract, sendContract);
  }

  public async save(id: string, createAgentsTeamReq: CreateAgentsTeamReq) {
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

    return deployContract(this.privateKey, generateContract, sendContract);
  }

  public async delete(id: string) {
    const generateContract = async () =>
      this.client.apiAiAgentsTeamsIdDeletePreparePost({
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

      return this.client.apiAiAgentsTeamsIdDeleteSendPost({
        id,
        signedContract,
      });
    };

    return deployContract(this.privateKey, generateContract, sendContract);
  }
}
