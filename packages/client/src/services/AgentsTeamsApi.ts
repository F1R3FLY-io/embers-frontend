import type { Graph } from "@f1r3fly-io/graphl-parser";

import { base16 } from "@scure/base";

import type {
  ChannelContext,
  CreateAgentsTeamReq,
  CreateGrantReq,
  FetchAPI,
  FireskyReply,
  GrantChannel,
  HTTPHeaders,
  Middleware,
  PublishToFireskyReq,
  PublishToMailReq,
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
import type { AgentTracePage, TraceSession } from "./Trace";

import { AIAgentsTeamsApi, Configuration } from "../api-client";
import { apiErrorMiddleware } from "../apiErrors";
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
      middleware: [...(config.middleware ?? []), apiErrorMiddleware],
    });
    this.client = new AIAgentsTeamsApi(configuration);
  }

  public async unlockTrace(
    runId: string,
    config?: ContractCallConfig,
  ): Promise<TraceSession> {
    const prepared = await this.client.agentsTeamsPrepareTrace(
      { runId },
      { signal: config?.signal },
    );
    const request = signContract(prepared.response.contract, this.privateKey);
    return this.client.agentsTeamsSendTrace(
      {
        runId,
        sendRequestBodySignedContractStringTracePrepareResponse: {
          prepareRequest: runId,
          prepareResponse: prepared.response,
          request,
          token: prepared.token,
        },
      },
      { signal: config?.signal },
    ) as Promise<TraceSession>;
  }

  public async readTrace(
    runId: string,
    accessToken: string,
    offset = 0,
    config?: QueryCallConfig,
  ): Promise<AgentTracePage> {
    return this.client.agentsTeamsReadTrace(
      { authorization: `Bearer ${accessToken}`, offset, runId },
      { signal: config?.signal },
    ) as Promise<AgentTracePage>;
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

  /**
   * Creates a standing channel grant: "channel identity `grantee` may
   * initiate runs of `agentsTeam` owned by me, within caps, with the
   * delegated authority". Signed here, where the grantor's key lives; the
   * chain derives the grantor from the deploy's signer.
   *
   * When `requireToken` was requested, the minted subject bearer token is
   * present exactly once at `prepareResponse.response.requireToken`; it is
   * never stored and cannot be recovered later, so the caller must surface it
   * immediately.
   */
  public async createGrant(
    createGrantReq: CreateGrantReq,
    config?: ContractCallConfig,
  ) {
    const prepareResponse = await this.client.agentsTeamsPrepareCreateGrant(
      { createGrantReq },
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

    const sendResponse = await this.client.agentsTeamsSendCreateGrant(
      {
        sendRequestBodySignedContractCreateGrantReqCreateGrantResp: {
          prepareRequest: createGrantReq,
          prepareResponse: prepareResponse.response,
          request: signedContract,
          token: prepareResponse.token,
        },
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse, waitForFinalization };
  }

  /**
   * Revokes a grant. Delivery-only for in-flight runs: they complete for
   * their owner, while the grantee's reveal and command claims fail from the
   * moment of revocation.
   */
  public async revokeGrant(grantId: string, config?: ContractCallConfig) {
    const prepareResponse = await this.client.agentsTeamsPrepareRevokeGrant(
      { grantId },
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

    const sendResponse = await this.client.agentsTeamsSendRevokeGrant(
      {
        grantId,
        sendRequestBodySignedContractStringRevokeGrantResp: {
          prepareRequest: grantId,
          prepareResponse: prepareResponse.response,
          request: signedContract,
          token: prepareResponse.token,
        },
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse, waitForFinalization };
  }

  /** Grants this wallet has created, revoked ones included and flagged. */
  public async grantsByGrantor(config?: QueryCallConfig) {
    return this.client.agentsTeamsGrantsByGrantor(
      { address: this.address },
      { signal: config?.signal },
    );
  }

  /**
   * Grants naming a channel wallet as grantee: an operations cross-check;
   * channel services consume the observer-readable chain clause directly.
   */
  public async grantsByGrantee(grantee: Address, config?: QueryCallConfig) {
    return this.client.agentsTeamsGrantsByGrantee(
      { address: grantee },
      { signal: config?.signal },
    );
  }

  /**
   * Runs the granted team with this wallet signing and paying the deploy
   * while the grantor owns the run. The target team comes from the grant;
   * the response names it. Mirrors `run`: the send blocks until chain
   * finality and returns the untyped run-state JSON, and the run state stays
   * pollable through `getRun` regardless of how the send call ends.
   */
  public async runUnderGrant(
    grantId: string,
    prompt: string,
    channelContext: ChannelContext,
    config?: ContractCallConfig,
  ) {
    const prepareRequest = {
      channelContext,
      grantId,
      prompt,
    };

    const prepareResponse = await this.client.agentsTeamsPrepareRunUnderGrant(
      { runUnderGrantReq: prepareRequest },
      { signal: config?.signal },
    );

    const signedContract = signContract(
      prepareResponse.response.run.contract,
      this.privateKey,
    );

    const sendResponse: unknown =
      await this.client.agentsTeamsSendRunUnderGrant(
        {
          sendRequestBodySignedContractRunUnderGrantReqRunUnderGrantResp: {
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

  /**
   * Binds `localPart@mailDomain` to the team on chain. The prepare is
   * side-effect light (a render plus a uniqueness read), the binding carries
   * no key material, and unpublishing is reversible.
   */
  public async publishToMail(
    id: string,
    publishToMailReq: PublishToMailReq,
    config?: ContractCallConfig,
  ) {
    const prepareResponse = await this.client.agentsTeamsPreparePublishToMail(
      {
        address: this.address,
        id,
        publishToMailReq,
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

    const sendResponse = await this.client.agentsTeamsSendPublishToMail(
      {
        address: this.address,
        id,
        sendRequestBodySignedContractPublishToMailReqPublishToMailResp: {
          prepareRequest: publishToMailReq,
          prepareResponse: prepareResponse.response,
          request: signedContract,
          token: prepareResponse.token,
        },
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse, waitForFinalization };
  }

  /** Deactivates the team's mail binding; publishing again reactivates it. */
  public async unpublishMail(id: string, config?: ContractCallConfig) {
    const prepareResponse = await this.client.agentsTeamsPrepareUnpublishMail(
      {
        address: this.address,
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

    const sendResponse = await this.client.agentsTeamsSendUnpublishMail(
      {
        address: this.address,
        id,
        sendRequestBodySignedContractStringUnpublishMailResp: {
          prepareRequest: id,
          prepareResponse: prepareResponse.response,
          request: signedContract,
          token: prepareResponse.token,
        },
      },
      { signal: config?.signal },
    );

    return { prepareResponse, sendResponse, waitForFinalization };
  }

  /**
   * Where the team is reachable, per channel, with honestly three-valued
   * reachability: `null` means "could not be determined" and must never be
   * rendered as missing.
   */
  public async publishedChannels(id: string, config?: QueryCallConfig) {
    return this.client.agentsTeamsPublishedChannels(
      {
        address: this.address,
        id,
      },
      { signal: config?.signal },
    );
  }

  /** Every binding for a channel; an HTTP mirror of the chain clause. */
  public async bindingsByChannel(
    channel: GrantChannel,
    config?: QueryCallConfig,
  ) {
    return this.client.agentsTeamsBindingsByChannel(
      { channel },
      { signal: config?.signal },
    );
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
