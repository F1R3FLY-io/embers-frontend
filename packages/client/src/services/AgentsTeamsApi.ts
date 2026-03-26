import type { Graph } from "@f1r3fly-io/graphl-parser";

import type {
  CreateAgentsTeamReq,
  FireskyReply,
  HTTPHeaders,
  PublishToFireskyReq,
} from "@/api-client";
import type {
  ContractCallConfig,
  QueryCallConfig,
} from "@/entities/HttpCallConfigs";
import type { Uri } from "@/entities/Uri";

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

/** Build fetch init overrides that add valid_after block number header */
function withValidAfter(
  config?: ContractCallConfig,
): RequestInit | undefined {
  if (config?.validAfterBlockNumber != null) {
    return {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Valid-After-Block": String(config.validAfterBlockNumber),
      },
    };
  }
  return undefined;
}

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

  public async create(
    createAgentsTeamReq: CreateAgentsTeamReq,
    config?: ContractCallConfig,
  ) {
    const prepareResponse = await this.client.apiAiAgentsTeamsCreatePreparePost(
      { createAgentsTeamReq },
      withValidAfter(config) ?? { signal: config?.signal },
    );

    const signedContract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );
    const sendResponse = await this.client.apiAiAgentsTeamsCreateSendPost(
      {
        sendRequestBodySignedContractCreateAgentsTeamReqCreateAgentsTeamResp: {
          prepareRequest: createAgentsTeamReq,
          prepareResponse: prepareResponse.response,
          request: signedContract,
          token: prepareResponse.token,
        },
      },
      { signal: config?.signal },
    );

    const blockNumber = await this.events.subscribeForDeploy(
      sendResponse.deployId,
      config?.maxWaitForFinalisation ?? 120_000,
    );

    return { prepareResponse, sendResponse, blockNumber };
  }

  public async get(config?: QueryCallConfig) {
    return this.client.apiAiAgentsTeamsAddressGet(
      {
        address: this.address,
      },
      { signal: config?.signal },
    );
  }

  public async getVersion(
    id: string,
    version: string,
    config?: QueryCallConfig,
  ) {
    return this.client.apiAiAgentsTeamsAddressIdVersionsVersionGet(
      {
        address: this.address,
        id,
        version,
      },
      { signal: config?.signal },
    );
  }

  public async getVersions(id: string, config?: QueryCallConfig) {
    return this.client.apiAiAgentsTeamsAddressIdVersionsGet(
      {
        address: this.address,
        id,
      },
      { signal: config?.signal },
    );
  }

  public async deployGraph(
    graph: Graph,
    phloLimit: Amount,
    registryVersion: bigint,
    registryKey: PrivateKey,
    config?: ContractCallConfig,
  ) {
    const timestamp = new Date();
    const prepareRequest = {
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
      type: "Graph" as const,
    };

    const prepareResponse = await this.client.apiAiAgentsTeamsDeployPreparePost(
      {
        deployAgentsTeamReq: prepareRequest,
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
    const sendResponse = await this.client.apiAiAgentsTeamsDeploySendPost(
      {
        sendRequestBodyDeploySignedAgentsTeamReqDeployAgentsTeamReqDeployAgentsTeamResp:
          {
            prepareRequest,
            prepareResponse: prepareResponse.response,
            request: { contract, system },
            token: prepareResponse.token,
          },
      },
      { signal: config?.signal },
    );

    const blockNumber = await this.events.subscribeForDeploy(
      sendResponse.deployId,
      config?.maxWaitForFinalisation ?? 120_000,
    );

    return { prepareResponse, sendResponse, blockNumber };
  }

  public async deploy(
    id: string,
    version: string,
    phloLimit: Amount,
    registryVersion: bigint,
    registryKey: PrivateKey,
    config?: ContractCallConfig,
  ) {
    const timestamp = new Date();
    const prepareRequest = {
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
      type: "AgentsTeam" as const,
      version,
    };

    const prepareResponse =
      await this.client.apiAiAgentsTeamsDeployPreparePost(
        { deployAgentsTeamReq: prepareRequest },
        withValidAfter(config) ?? { signal: config?.signal },
      );

    const contract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );
    const system =
      prepareResponse.response.system &&
      signContract(prepareResponse.response.system, this.privateKey);
    const sendResponse = await this.client.apiAiAgentsTeamsDeploySendPost(
      {
        sendRequestBodyDeploySignedAgentsTeamReqDeployAgentsTeamReqDeployAgentsTeamResp:
          {
            prepareRequest,
            prepareResponse: prepareResponse.response,
            request: { contract, system },
            token: prepareResponse.token,
          },
      },
      { signal: config?.signal },
    );

    const blockNumber = await this.events.subscribeForDeploy(
      sendResponse.deployId,
      config?.maxWaitForFinalisation ?? 120_000,
    );

    return { prepareResponse, sendResponse, blockNumber };
  }

  public async run(
    agentTeamUri: Uri,
    prompt: string,
    phloLimit: Amount,
    config?: ContractCallConfig,
  ) {
    const prepareRequest = {
      agentsTeam: agentTeamUri,
      phloLimit: phloLimit.value,
      prompt,
    };

    const prepareResponse = await this.client.apiAiAgentsTeamsRunPreparePost(
      {
        runReq: prepareRequest,
      },
      { signal: config?.signal },
    );

    const signedContract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );

    const sendResponse: unknown = await this.client.apiAiAgentsTeamsRunSendPost(
      {
        sendRequestBodySignedContractRunReqRunResp: {
          prepareRequest,
          prepareResponse: prepareResponse.response,
          request: signedContract,
          token: prepareResponse.token,
        },
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse };
  }

  public async save(
    id: string,
    createAgentsTeamReq: CreateAgentsTeamReq,
    config?: ContractCallConfig,
  ) {
    const prepareResponse =
      await this.client.apiAiAgentsTeamsIdSavePreparePost(
        { address: this.address, createAgentsTeamReq, id },
        withValidAfter(config) ?? { signal: config?.signal },
      );

    const signedContract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );
    const sendResponse = await this.client.apiAiAgentsTeamsIdSaveSendPost(
      {
        address: this.address,
        id,
        sendRequestBodySignedContractCreateAgentsTeamReqSaveAgentsTeamResp: {
          prepareRequest: createAgentsTeamReq,
          prepareResponse: prepareResponse.response,
          request: signedContract,
          token: prepareResponse.token,
        },
      },
      { signal: config?.signal },
    );

    const blockNumber = await this.events.subscribeForDeploy(
      sendResponse.deployId,
      config?.maxWaitForFinalisation ?? 120_000,
    );

    return { prepareResponse, sendResponse, blockNumber };
  }

  public async delete(id: string, config?: ContractCallConfig) {
    const prepareResponse =
      await this.client.apiAiAgentsTeamsIdDeletePreparePost(
        {
          id,
        },
        { signal: config?.signal },
      );

    const signedContract = signContract(
      prepareResponse.contract,
      this.privateKey,
    );
    const sendResponse = await this.client.apiAiAgentsTeamsIdDeleteSendPost(
      {
        id,
        signedContract,
      },
      { signal: config?.signal },
    );

    const blockNumber = await this.events.subscribeForDeploy(
      sendResponse.deployId,
      config?.maxWaitForFinalisation ?? 120_000,
    );

    return { prepareResponse, sendResponse, blockNumber };
  }

  public async publishToFiresky(
    id: string,
    publishToFireskyReq: PublishToFireskyReq,
    config?: ContractCallConfig,
  ) {
    const prepareResponse =
      await this.client.apiAiAgentsTeamsAddressIdPublishToFireskyPreparePost(
        { address: this.address, id, publishToFireskyReq },
        withValidAfter(config) ?? { signal: config?.signal },
      );

    const signedContract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );
    const sendResponse =
      await this.client.apiAiAgentsTeamsAddressIdPublishToFireskySendPost(
        {
          address: this.address,
          id,
          sendRequestBodySignedContractPublishToFireskyReqPublishToFireskyResp:
            {
              prepareRequest: publishToFireskyReq,
              prepareResponse: prepareResponse.response,
              request: signedContract,
              token: prepareResponse.token,
            },
        },
        { signal: config?.signal },
      );

    const blockNumber = await this.events.subscribeForDeploy(
      sendResponse.deployId,
      config?.maxWaitForFinalisation ?? 120_000,
    );

    return { prepareResponse, sendResponse, blockNumber };
  }

  public async runOnFiresky(
    agentTeamUri: Uri,
    prompt: string,
    phloLimit: Amount,
    replyTo?: FireskyReply,
    config?: ContractCallConfig,
  ) {
    const prepareRequest = {
      agentsTeam: agentTeamUri,
      phloLimit: phloLimit.value,
      prompt,
    };

    const prepareResponse =
      await this.client.apiAiAgentsTeamsRunOnFireskyPreparePost(
        {
          runReq: prepareRequest,
        },
        { signal: config?.signal },
      );

    const signedContract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );

    await this.client.apiAiAgentsTeamsRunOnFireskySendPost(
      {
        sendRequestBodyDeploySignedRunOnFireskyReqRunReqRunResp: {
          prepareRequest,
          prepareResponse: prepareResponse.response,
          request: {
            contract: signedContract,
            replyTo,
          },
          token: prepareResponse.token,
        },
      },
      { signal: config?.signal },
    );

    return prepareResponse;
  }
}
