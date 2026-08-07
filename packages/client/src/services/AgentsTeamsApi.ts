import type { Graph } from "@f1r3fly-io/graphl-parser";

import { base16 } from "@scure/base";

import type {
  CreateAgentsTeamReq,
  FetchAPI,
  FireskyReply,
  HTTPHeaders,
  Middleware,
  PublishToFireskyReq,
  RunCommandReq,
} from "../api-client";
import type { Address } from "../entities/Address";
import type {
  ContractCallConfig,
  QueryCallConfig,
} from "../entities/HttpCallConfigs";
import type { PrivateKey } from "../entities/PrivateKey";
import type { Uri } from "../entities/Uri";
import type { EmbersEvents } from "./EmbersEvents";

import { AIAgentsTeamsApi, Configuration } from "../api-client";
import { insertSignedSignature, signContract } from "../functions";
import { DEFAULT_MAX_WAIT_FOR_FINALISATION } from "./EmbersEvents";

export type AgentsTeamsConfig = {
  basePath: string;
  fetchApi?: FetchAPI;
  headers?: HTTPHeaders;
  middleware?: Middleware[];
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
      fetchApi: config.fetchApi,
      headers: config.headers,
      middleware: config.middleware,
    });
    this.client = new AIAgentsTeamsApi(configuration);
  }

  public async create(
    createAgentsTeamReq: CreateAgentsTeamReq,
    config?: ContractCallConfig,
  ) {
    const prepareResponse = await this.client.agentsTeamsPrepareCreate(
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
      config?.maxWaitForFinalisation ?? DEFAULT_MAX_WAIT_FOR_FINALISATION,
    );

    const sendResponse = await this.client.agentsTeamsSendCreate(
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
    return this.client.agentsTeamsList(
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
    return this.client.agentsTeamsGetVersion(
      {
        address: this.address,
        id,
        version,
      },
      { signal: config?.signal },
    );
  }

  public async getVersions(id: string, config?: QueryCallConfig) {
    return this.client.agentsTeamsListVersions(
      {
        address: this.address,
        id,
      },
      { signal: config?.signal },
    );
  }

  public async deployGraph(
    graph: Graph,
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
      type: "Graph" as const,
    };

    const prepareResponse = await this.client.agentsTeamsPrepareDeploy(
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
      config?.maxWaitForFinalisation ?? DEFAULT_MAX_WAIT_FOR_FINALISATION,
    );

    const sendResponse = await this.client.agentsTeamsSendDeploy(
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

    return { prepareResponse, sendResponse, waitForFinalization };
  }

  public async deploy(
    id: string,
    version: string,
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
      type: "AgentsTeam" as const,
      version,
    };

    const prepareResponse = await this.client.agentsTeamsPrepareDeploy(
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
      config?.maxWaitForFinalisation ?? DEFAULT_MAX_WAIT_FOR_FINALISATION,
    );

    const sendResponse = await this.client.agentsTeamsSendDeploy(
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

    return { prepareResponse, sendResponse, waitForFinalization };
  }

  public async run(
    agentTeamUri: Uri,
    prompt: string,
    config?: ContractCallConfig,
  ) {
    const prepareRequest = {
      agentsTeam: agentTeamUri,
      prompt,
    };

    const prepareResponse = await this.client.agentsTeamsPrepareRun(
      {
        runReq: prepareRequest,
      },
      { signal: config?.signal },
    );

    const signedContract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );

    const sendResponse: unknown = await this.client.agentsTeamsSendRun(
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

  public async getRun(runId: string, config?: QueryCallConfig) {
    return this.client.agentsTeamsGetRun({ runId }, { signal: config?.signal });
  }

  /**
   * Atomically claims and applies one durable command against an exact run
   * revision. The prepare request is intentionally preserved byte-for-byte in
   * the send envelope so the backend can cross-check its signed public claim
   * against the encrypted command artifact.
   */
  public async command(
    runId: string,
    runCommandReq: RunCommandReq,
    config?: ContractCallConfig,
  ) {
    const prepareResponse = await this.client.agentsTeamsPrepareRunCommand(
      { runCommandReq, runId },
      { signal: config?.signal },
    );
    const signedContract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );
    const sendResponse: unknown = await this.client.agentsTeamsSendRunCommand(
      {
        runId,
        sendRequestBodySignedContractRunCommandReqRunCommandResp: {
          prepareRequest: runCommandReq,
          prepareResponse: prepareResponse.response,
          request: signedContract,
          token: prepareResponse.token,
        },
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse };
  }

  /**
   * Owner-authenticated read of a completed run's final output value. The
   * on-chain claimOutputReveal clause adjudicates ownership (the ledger
   * scrubs the owner from every public read), records an actor-less
   * outputRevealed event, and the decrypted value returns only over this
   * signed exchange -- the public run ledger stays metadata-only.
   */
  public async revealOutput(runId: string, config?: ContractCallConfig) {
    const prepareResponse = await this.client.agentsTeamsPrepareRevealOutput(
      { runId },
      { signal: config?.signal },
    );
    const signedContract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );
    const sendResponse: unknown = await this.client.agentsTeamsSendRevealOutput(
      {
        runId,
        sendRequestBodySignedContractStringRevealOutputResp: {
          prepareRequest: runId,
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
    const prepareResponse = await this.client.agentsTeamsPrepareSave(
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
      config?.maxWaitForFinalisation ?? DEFAULT_MAX_WAIT_FOR_FINALISATION,
    );

    const sendResponse = await this.client.agentsTeamsSendSave(
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
    const prepareResponse = await this.client.agentsTeamsPrepareDelete(
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
      config?.maxWaitForFinalisation ?? DEFAULT_MAX_WAIT_FOR_FINALISATION,
    );

    const sendResponse = await this.client.agentsTeamsSendDelete(
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
    publishToFireskyReq: PublishToFireskyReq,
    config?: ContractCallConfig,
  ) {
    const prepareResponse =
      await this.client.agentsTeamsPreparePublishToFiresky(
        {
          address: this.address,
          id,
          publishToFireskyReq,
        },
        { signal: config?.signal },
      );

    const signedContract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );
    const waitForFinalization = this.events.subscribeForDeploy(
      base16.encode(signedContract.sig).toLowerCase(),
      config?.maxWaitForFinalisation ?? DEFAULT_MAX_WAIT_FOR_FINALISATION,
    );

    const sendResponse = await this.client.agentsTeamsSendPublishToFiresky(
      {
        address: this.address,
        id,
        sendRequestBodySignedContractPublishToFireskyReqPublishToFireskyResp: {
          prepareRequest: publishToFireskyReq,
          prepareResponse: prepareResponse.response,
          request: signedContract,
          token: prepareResponse.token,
        },
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse, waitForFinalization };
  }

  public async runOnFiresky(
    agentTeamUri: Uri,
    prompt: string,
    replyTo?: FireskyReply,
    config?: ContractCallConfig,
  ) {
    const prepareRequest = {
      agentsTeam: agentTeamUri,
      prompt,
    };

    const prepareResponse = await this.client.agentsTeamsPrepareRunOnFiresky(
      {
        runReq: prepareRequest,
      },
      { signal: config?.signal },
    );

    const signedContract = signContract(
      prepareResponse.response.contract,
      this.privateKey,
    );

    await this.client.agentsTeamsSendRunOnFiresky(
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
