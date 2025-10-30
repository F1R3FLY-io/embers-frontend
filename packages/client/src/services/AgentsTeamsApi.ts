import type { Graph } from "@f1r3fly-io/graphl-parser";

import { base16 } from "@scure/base";

import type { CreateAgentsTeamReq, HTTPHeaders } from "@/api-client";

import { AIAgentsTeamsApi, Configuration } from "@/api-client";
import { insertSignedSignature, signContract } from "@/functions";

import type { Address } from "../entities/Address";
import type { Amount } from "../entities/Amount";
import type { PrivateKey } from "../entities/PrivateKey";
import type { EmbersEvents } from "./EmbersEvents";

export type AgentsTeamsConfig = {
  basePath: string;
  headers?: HTTPHeaders;
  privateKey: PrivateKey;
};

export class AgentsTeamsApiSdk {
  private client: AIAgentsTeamsApi;
  private privateKey: PrivateKey;
  public readonly address: Address;

  public constructor(
    config: AgentsTeamsConfig,
    private events: EmbersEvents,
  ) {
    this.privateKey = config.privateKey;
    this.address = this.privateKey.getPublicKey().getAddress();

    const configuration = new Configuration({
      basePath: config.basePath,
      headers: config.headers,
    });
    this.client = new AIAgentsTeamsApi(configuration);
  }

  public async create(createAgentsTeamReq: CreateAgentsTeamReq) {
    const prepareModel = await this.client.apiAiAgentsTeamsCreatePreparePost({
      createAgentsTeamReq,
    });

    const signedContract = signContract(prepareModel.contract, this.privateKey);
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(signedContract.sig).toLowerCase(),
      15_000,
    );

    const sendModel = await this.client.apiAiAgentsTeamsCreateSendPost({
      signedContract,
    });

    return { prepareModel, sendModel, waitForFinalization };
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

    const contract = signContract(prepareModel.contract, this.privateKey);
    const system =
      prepareModel.system && signContract(prepareModel.system, this.privateKey);
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(contract.sig).toLowerCase(),
      15_000,
    );

    const sendModel = await this.client.apiAiAgentsTeamsDeploySendPost({
      deploySignedAgentsTeamtReq: { contract, system },
    });

    return { prepareModel, sendModel, waitForFinalization };
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

    const contract = signContract(prepareModel.contract, this.privateKey);
    const system =
      prepareModel.system && signContract(prepareModel.system, this.privateKey);
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(contract.sig).toLowerCase(),
      15_000,
    );

    const sendModel = await this.client.apiAiAgentsTeamsDeploySendPost({
      deploySignedAgentsTeamtReq: { contract, system },
    });

    return { prepareModel, sendModel, waitForFinalization };
  }

  public async run(agentTeamUri: string, prompt: string, phloLimit: Amount) {
    const prepareModel = await this.client.apiAiAgentsTeamsRunPreparePost({
      runAgentsTeamReq: {
        agentsTeam: agentTeamUri,
        phloLimit: phloLimit.value,
        prompt,
      },
    });

    const signedContract = signContract(prepareModel.contract, this.privateKey);

    const sendModel: unknown = await this.client.apiAiAgentsTeamsRunSendPost({
      signedContract,
    });

    return { prepareModel, sendModel };
  }

  public async save(id: string, createAgentsTeamReq: CreateAgentsTeamReq) {
    const prepareModel = await this.client.apiAiAgentsTeamsIdSavePreparePost({
      createAgentsTeamReq,
      id,
    });

    const signedContract = signContract(prepareModel.contract, this.privateKey);
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(signedContract.sig).toLowerCase(),
      15_000,
    );

    const sendModel = await this.client.apiAiAgentsTeamsIdSaveSendPost({
      id,
      signedContract,
    });

    return { prepareModel, sendModel, waitForFinalization };
  }

  public async delete(id: string) {
    const prepareModel = await this.client.apiAiAgentsTeamsIdDeletePreparePost({
      id,
    });

    const signedContract = signContract(prepareModel.contract, this.privateKey);
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(signedContract.sig).toLowerCase(),
      15_000,
    );

    const sendModel = await this.client.apiAiAgentsTeamsIdDeleteSendPost({
      id,
      signedContract,
    });

    return { prepareModel, sendModel, waitForFinalization };
  }
}
