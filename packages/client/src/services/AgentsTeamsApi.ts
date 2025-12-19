import type { Graph } from "@f1r3fly-io/graphl-parser";

import { base16 } from "@scure/base";

import type {
  CreateAgentsTeamReq,
  FireskyReply,
  HTTPHeaders,
  PublishAgentsTeamToFireskyReq,
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
      {
        createAgentsTeamReq,
      },
      { signal: config?.signal },
    );

    const signedContract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(signedContract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? 15_000,
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

    return { prepareResponse, sendResponse, waitForFinalization };
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
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(contract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? 15_000,
    );

    const sendResponse = await this.client.apiAiAgentsTeamsDeploySendPost(
      {
        sendRequestBodyDeploySignedAgentsTeamtReqDeployAgentsTeamReqDeployAgentsTeamResp:
          {
            prepareRequest,
            prepareResponse: prepareResponse.response,
            request: { contract, system },
            token: prepareResponse.token,
          },
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse, waitForFinalization };
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
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(contract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? 15_000,
    );

    const sendResponse = await this.client.apiAiAgentsTeamsDeploySendPost(
      {
        sendRequestBodyDeploySignedAgentsTeamtReqDeployAgentsTeamReqDeployAgentsTeamResp:
          {
            prepareRequest,
            prepareResponse: prepareResponse.response,
            request: { contract, system },
            token: prepareResponse.token,
          },
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse, waitForFinalization };
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
        runAgentsTeamReq: prepareRequest,
      },
      { signal: config?.signal },
    );

    const signedContract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );

    const sendResponse: unknown = await this.client.apiAiAgentsTeamsRunSendPost(
      {
        sendRequestBodySignedContractRunAgentsTeamReqRunAgentsTeamResp: {
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
    const prepareResponse = await this.client.apiAiAgentsTeamsIdSavePreparePost(
      {
        createAgentsTeamReq,
        id,
      },
      { signal: config?.signal },
    );

    const signedContract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(signedContract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? 15_000,
    );

    const sendResponse = await this.client.apiAiAgentsTeamsIdSaveSendPost(
      {
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

    return { prepareResponse, sendResponse, waitForFinalization };
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
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(signedContract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? 15_000,
    );

    const sendResponse = await this.client.apiAiAgentsTeamsIdDeleteSendPost(
      {
        id,
        signedContract,
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse, waitForFinalization };
  }

  public async publishToFiresky(
    id: string,
    publishAgentsTeamToFireskyReq: PublishAgentsTeamToFireskyReq,
    config?: ContractCallConfig,
  ) {
    const prepareResponse =
      await this.client.apiAiAgentsTeamsAddressIdPublishToFireskyPreparePost(
        {
          address: this.address,
          id,
          publishAgentsTeamToFireskyReq,
        },
        { signal: config?.signal },
      );

    const signedContract = signContract(
      prepareResponse.contract,
      this.privateKey,
    );
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(signedContract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? 15_000,
    );

    const sendResponse =
      await this.client.apiAiAgentsTeamsAddressIdPublishToFireskySendPost(
        {
          address: this.address,
          id,
          signedContract,
        },
        { signal: config?.signal },
      );

    return { prepareResponse, sendResponse, waitForFinalization };
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
          runAgentsTeamReq: prepareRequest,
        },
        { signal: config?.signal },
      );

    const signedContract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );

    await this.client.apiAiAgentsTeamsRunOnFireskySendPost(
      {
        sendRequestBodyDeploySignedRunAgentsTeamFireskyReqRunAgentsTeamReqRunAgentsTeamResp:
          {
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
