/* tslint:disable */
/* eslint-disable */
/**
 * Embers API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 0.1.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import * as runtime from "../runtime";
import type {
  Agent,
  Agents,
  CreateAgentReq,
  CreateAgentResp,
  CreateTestwalletResp,
  DeployAgentResp,
  DeploySignedTestReq,
  DeploySignedTestResp,
  DeployTestReq,
  DeployTestResp,
  InternalError,
  SaveAgentResp,
  SignedContract,
} from "../models/index";
import {
  AgentFromJSON,
  AgentToJSON,
  AgentsFromJSON,
  AgentsToJSON,
  CreateAgentReqFromJSON,
  CreateAgentReqToJSON,
  CreateAgentRespFromJSON,
  CreateAgentRespToJSON,
  CreateTestwalletRespFromJSON,
  CreateTestwalletRespToJSON,
  DeployAgentRespFromJSON,
  DeployAgentRespToJSON,
  DeploySignedTestReqFromJSON,
  DeploySignedTestReqToJSON,
  DeploySignedTestRespFromJSON,
  DeploySignedTestRespToJSON,
  DeployTestReqFromJSON,
  DeployTestReqToJSON,
  DeployTestRespFromJSON,
  DeployTestRespToJSON,
  InternalErrorFromJSON,
  InternalErrorToJSON,
  SaveAgentRespFromJSON,
  SaveAgentRespToJSON,
  SignedContractFromJSON,
  SignedContractToJSON,
} from "../models/index";

export interface ApiAiAgentsAddressGetRequest {
  address: string;
}

export interface ApiAiAgentsAddressIdVersionDeployPreparePostRequest {
  address: string;
  id: string;
  version: string;
}

export interface ApiAiAgentsAddressIdVersionDeploySendPostRequest {
  address: string;
  id: string;
  version: string;
  signedContract: SignedContract;
}

export interface ApiAiAgentsAddressIdVersionGetRequest {
  address: string;
  id: string;
  version: string;
}

export interface ApiAiAgentsAddressIdVersionsGetRequest {
  address: string;
  id: string;
}

export interface ApiAiAgentsCreatePreparePostRequest {
  createAgentReq: CreateAgentReq;
}

export interface ApiAiAgentsCreateSendPostRequest {
  signedContract: SignedContract;
}

export interface ApiAiAgentsIdSavePreparePostRequest {
  id: string;
  createAgentReq: CreateAgentReq;
}

export interface ApiAiAgentsIdSaveSendPostRequest {
  id: string;
  signedContract: SignedContract;
}

export interface ApiAiAgentsTestDeployPreparePostRequest {
  deployTestReq: DeployTestReq;
}

export interface ApiAiAgentsTestDeploySendPostRequest {
  deploySignedTestReq: DeploySignedTestReq;
}

/**
 *
 */
export class AIAgentsApi extends runtime.BaseAPI {
  /**
   */
  async apiAiAgentsAddressGetRaw(
    requestParameters: ApiAiAgentsAddressGetRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<runtime.ApiResponse<Agents>> {
    if (requestParameters["address"] == null) {
      throw new runtime.RequiredError(
        "address",
        'Required parameter "address" was null or undefined when calling apiAiAgentsAddressGet().',
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    let urlPath = `/api/ai-agents/{address}`;
    urlPath = urlPath.replace(
      `{${"address"}}`,
      encodeURIComponent(String(requestParameters["address"])),
    );

    const response = await this.request(
      {
        path: urlPath,
        method: "GET",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides,
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      AgentsFromJSON(jsonValue),
    );
  }

  /**
   */
  async apiAiAgentsAddressGet(
    requestParameters: ApiAiAgentsAddressGetRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<Agents> {
    const response = await this.apiAiAgentsAddressGetRaw(
      requestParameters,
      initOverrides,
    );
    return await response.value();
  }

  /**
   */
  async apiAiAgentsAddressIdVersionDeployPreparePostRaw(
    requestParameters: ApiAiAgentsAddressIdVersionDeployPreparePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<runtime.ApiResponse<DeployAgentResp>> {
    if (requestParameters["address"] == null) {
      throw new runtime.RequiredError(
        "address",
        'Required parameter "address" was null or undefined when calling apiAiAgentsAddressIdVersionDeployPreparePost().',
      );
    }

    if (requestParameters["id"] == null) {
      throw new runtime.RequiredError(
        "id",
        'Required parameter "id" was null or undefined when calling apiAiAgentsAddressIdVersionDeployPreparePost().',
      );
    }

    if (requestParameters["version"] == null) {
      throw new runtime.RequiredError(
        "version",
        'Required parameter "version" was null or undefined when calling apiAiAgentsAddressIdVersionDeployPreparePost().',
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    let urlPath = `/api/ai-agents/{address}/{id}/{version}/deploy/prepare`;
    urlPath = urlPath.replace(
      `{${"address"}}`,
      encodeURIComponent(String(requestParameters["address"])),
    );
    urlPath = urlPath.replace(
      `{${"id"}}`,
      encodeURIComponent(String(requestParameters["id"])),
    );
    urlPath = urlPath.replace(
      `{${"version"}}`,
      encodeURIComponent(String(requestParameters["version"])),
    );

    const response = await this.request(
      {
        path: urlPath,
        method: "POST",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides,
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      DeployAgentRespFromJSON(jsonValue),
    );
  }

  /**
   */
  async apiAiAgentsAddressIdVersionDeployPreparePost(
    requestParameters: ApiAiAgentsAddressIdVersionDeployPreparePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<DeployAgentResp> {
    const response = await this.apiAiAgentsAddressIdVersionDeployPreparePostRaw(
      requestParameters,
      initOverrides,
    );
    return await response.value();
  }

  /**
   */
  async apiAiAgentsAddressIdVersionDeploySendPostRaw(
    requestParameters: ApiAiAgentsAddressIdVersionDeploySendPostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<runtime.ApiResponse<void>> {
    if (requestParameters["address"] == null) {
      throw new runtime.RequiredError(
        "address",
        'Required parameter "address" was null or undefined when calling apiAiAgentsAddressIdVersionDeploySendPost().',
      );
    }

    if (requestParameters["id"] == null) {
      throw new runtime.RequiredError(
        "id",
        'Required parameter "id" was null or undefined when calling apiAiAgentsAddressIdVersionDeploySendPost().',
      );
    }

    if (requestParameters["version"] == null) {
      throw new runtime.RequiredError(
        "version",
        'Required parameter "version" was null or undefined when calling apiAiAgentsAddressIdVersionDeploySendPost().',
      );
    }

    if (requestParameters["signedContract"] == null) {
      throw new runtime.RequiredError(
        "signedContract",
        'Required parameter "signedContract" was null or undefined when calling apiAiAgentsAddressIdVersionDeploySendPost().',
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    headerParameters["Content-Type"] = "application/json; charset=utf-8";

    let urlPath = `/api/ai-agents/{address}/{id}/{version}/deploy/send`;
    urlPath = urlPath.replace(
      `{${"address"}}`,
      encodeURIComponent(String(requestParameters["address"])),
    );
    urlPath = urlPath.replace(
      `{${"id"}}`,
      encodeURIComponent(String(requestParameters["id"])),
    );
    urlPath = urlPath.replace(
      `{${"version"}}`,
      encodeURIComponent(String(requestParameters["version"])),
    );

    const response = await this.request(
      {
        path: urlPath,
        method: "POST",
        headers: headerParameters,
        query: queryParameters,
        body: SignedContractToJSON(requestParameters["signedContract"]),
      },
      initOverrides,
    );

    return new runtime.VoidApiResponse(response);
  }

  /**
   */
  async apiAiAgentsAddressIdVersionDeploySendPost(
    requestParameters: ApiAiAgentsAddressIdVersionDeploySendPostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<void> {
    await this.apiAiAgentsAddressIdVersionDeploySendPostRaw(
      requestParameters,
      initOverrides,
    );
  }

  /**
   */
  async apiAiAgentsAddressIdVersionGetRaw(
    requestParameters: ApiAiAgentsAddressIdVersionGetRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<runtime.ApiResponse<Agent>> {
    if (requestParameters["address"] == null) {
      throw new runtime.RequiredError(
        "address",
        'Required parameter "address" was null or undefined when calling apiAiAgentsAddressIdVersionGet().',
      );
    }

    if (requestParameters["id"] == null) {
      throw new runtime.RequiredError(
        "id",
        'Required parameter "id" was null or undefined when calling apiAiAgentsAddressIdVersionGet().',
      );
    }

    if (requestParameters["version"] == null) {
      throw new runtime.RequiredError(
        "version",
        'Required parameter "version" was null or undefined when calling apiAiAgentsAddressIdVersionGet().',
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    let urlPath = `/api/ai-agents/{address}/{id}/{version}`;
    urlPath = urlPath.replace(
      `{${"address"}}`,
      encodeURIComponent(String(requestParameters["address"])),
    );
    urlPath = urlPath.replace(
      `{${"id"}}`,
      encodeURIComponent(String(requestParameters["id"])),
    );
    urlPath = urlPath.replace(
      `{${"version"}}`,
      encodeURIComponent(String(requestParameters["version"])),
    );

    const response = await this.request(
      {
        path: urlPath,
        method: "GET",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides,
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      AgentFromJSON(jsonValue),
    );
  }

  /**
   */
  async apiAiAgentsAddressIdVersionGet(
    requestParameters: ApiAiAgentsAddressIdVersionGetRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<Agent> {
    const response = await this.apiAiAgentsAddressIdVersionGetRaw(
      requestParameters,
      initOverrides,
    );
    return await response.value();
  }

  /**
   */
  async apiAiAgentsAddressIdVersionsGetRaw(
    requestParameters: ApiAiAgentsAddressIdVersionsGetRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<runtime.ApiResponse<Agents>> {
    if (requestParameters["address"] == null) {
      throw new runtime.RequiredError(
        "address",
        'Required parameter "address" was null or undefined when calling apiAiAgentsAddressIdVersionsGet().',
      );
    }

    if (requestParameters["id"] == null) {
      throw new runtime.RequiredError(
        "id",
        'Required parameter "id" was null or undefined when calling apiAiAgentsAddressIdVersionsGet().',
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    let urlPath = `/api/ai-agents/{address}/{id}/versions`;
    urlPath = urlPath.replace(
      `{${"address"}}`,
      encodeURIComponent(String(requestParameters["address"])),
    );
    urlPath = urlPath.replace(
      `{${"id"}}`,
      encodeURIComponent(String(requestParameters["id"])),
    );

    const response = await this.request(
      {
        path: urlPath,
        method: "GET",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides,
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      AgentsFromJSON(jsonValue),
    );
  }

  /**
   */
  async apiAiAgentsAddressIdVersionsGet(
    requestParameters: ApiAiAgentsAddressIdVersionsGetRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<Agents> {
    const response = await this.apiAiAgentsAddressIdVersionsGetRaw(
      requestParameters,
      initOverrides,
    );
    return await response.value();
  }

  /**
   */
  async apiAiAgentsCreatePreparePostRaw(
    requestParameters: ApiAiAgentsCreatePreparePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<runtime.ApiResponse<CreateAgentResp>> {
    if (requestParameters["createAgentReq"] == null) {
      throw new runtime.RequiredError(
        "createAgentReq",
        'Required parameter "createAgentReq" was null or undefined when calling apiAiAgentsCreatePreparePost().',
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    headerParameters["Content-Type"] = "application/json; charset=utf-8";

    let urlPath = `/api/ai-agents/create/prepare`;

    const response = await this.request(
      {
        path: urlPath,
        method: "POST",
        headers: headerParameters,
        query: queryParameters,
        body: CreateAgentReqToJSON(requestParameters["createAgentReq"]),
      },
      initOverrides,
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      CreateAgentRespFromJSON(jsonValue),
    );
  }

  /**
   */
  async apiAiAgentsCreatePreparePost(
    requestParameters: ApiAiAgentsCreatePreparePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<CreateAgentResp> {
    const response = await this.apiAiAgentsCreatePreparePostRaw(
      requestParameters,
      initOverrides,
    );
    return await response.value();
  }

  /**
   */
  async apiAiAgentsCreateSendPostRaw(
    requestParameters: ApiAiAgentsCreateSendPostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<runtime.ApiResponse<void>> {
    if (requestParameters["signedContract"] == null) {
      throw new runtime.RequiredError(
        "signedContract",
        'Required parameter "signedContract" was null or undefined when calling apiAiAgentsCreateSendPost().',
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    headerParameters["Content-Type"] = "application/json; charset=utf-8";

    let urlPath = `/api/ai-agents/create/send`;

    const response = await this.request(
      {
        path: urlPath,
        method: "POST",
        headers: headerParameters,
        query: queryParameters,
        body: SignedContractToJSON(requestParameters["signedContract"]),
      },
      initOverrides,
    );

    return new runtime.VoidApiResponse(response);
  }

  /**
   */
  async apiAiAgentsCreateSendPost(
    requestParameters: ApiAiAgentsCreateSendPostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<void> {
    await this.apiAiAgentsCreateSendPostRaw(requestParameters, initOverrides);
  }

  /**
   */
  async apiAiAgentsIdSavePreparePostRaw(
    requestParameters: ApiAiAgentsIdSavePreparePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<runtime.ApiResponse<SaveAgentResp>> {
    if (requestParameters["id"] == null) {
      throw new runtime.RequiredError(
        "id",
        'Required parameter "id" was null or undefined when calling apiAiAgentsIdSavePreparePost().',
      );
    }

    if (requestParameters["createAgentReq"] == null) {
      throw new runtime.RequiredError(
        "createAgentReq",
        'Required parameter "createAgentReq" was null or undefined when calling apiAiAgentsIdSavePreparePost().',
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    headerParameters["Content-Type"] = "application/json; charset=utf-8";

    let urlPath = `/api/ai-agents/{id}/save/prepare`;
    urlPath = urlPath.replace(
      `{${"id"}}`,
      encodeURIComponent(String(requestParameters["id"])),
    );

    const response = await this.request(
      {
        path: urlPath,
        method: "POST",
        headers: headerParameters,
        query: queryParameters,
        body: CreateAgentReqToJSON(requestParameters["createAgentReq"]),
      },
      initOverrides,
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      SaveAgentRespFromJSON(jsonValue),
    );
  }

  /**
   */
  async apiAiAgentsIdSavePreparePost(
    requestParameters: ApiAiAgentsIdSavePreparePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<SaveAgentResp> {
    const response = await this.apiAiAgentsIdSavePreparePostRaw(
      requestParameters,
      initOverrides,
    );
    return await response.value();
  }

  /**
   */
  async apiAiAgentsIdSaveSendPostRaw(
    requestParameters: ApiAiAgentsIdSaveSendPostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<runtime.ApiResponse<void>> {
    if (requestParameters["id"] == null) {
      throw new runtime.RequiredError(
        "id",
        'Required parameter "id" was null or undefined when calling apiAiAgentsIdSaveSendPost().',
      );
    }

    if (requestParameters["signedContract"] == null) {
      throw new runtime.RequiredError(
        "signedContract",
        'Required parameter "signedContract" was null or undefined when calling apiAiAgentsIdSaveSendPost().',
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    headerParameters["Content-Type"] = "application/json; charset=utf-8";

    let urlPath = `/api/ai-agents/{id}/save/send`;
    urlPath = urlPath.replace(
      `{${"id"}}`,
      encodeURIComponent(String(requestParameters["id"])),
    );

    const response = await this.request(
      {
        path: urlPath,
        method: "POST",
        headers: headerParameters,
        query: queryParameters,
        body: SignedContractToJSON(requestParameters["signedContract"]),
      },
      initOverrides,
    );

    return new runtime.VoidApiResponse(response);
  }

  /**
   */
  async apiAiAgentsIdSaveSendPost(
    requestParameters: ApiAiAgentsIdSaveSendPostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<void> {
    await this.apiAiAgentsIdSaveSendPostRaw(requestParameters, initOverrides);
  }

  /**
   */
  async apiAiAgentsTestDeployPreparePostRaw(
    requestParameters: ApiAiAgentsTestDeployPreparePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<runtime.ApiResponse<DeployTestResp>> {
    if (requestParameters["deployTestReq"] == null) {
      throw new runtime.RequiredError(
        "deployTestReq",
        'Required parameter "deployTestReq" was null or undefined when calling apiAiAgentsTestDeployPreparePost().',
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    headerParameters["Content-Type"] = "application/json; charset=utf-8";

    let urlPath = `/api/ai-agents/test/deploy/prepare`;

    const response = await this.request(
      {
        path: urlPath,
        method: "POST",
        headers: headerParameters,
        query: queryParameters,
        body: DeployTestReqToJSON(requestParameters["deployTestReq"]),
      },
      initOverrides,
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      DeployTestRespFromJSON(jsonValue),
    );
  }

  /**
   */
  async apiAiAgentsTestDeployPreparePost(
    requestParameters: ApiAiAgentsTestDeployPreparePostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<DeployTestResp> {
    const response = await this.apiAiAgentsTestDeployPreparePostRaw(
      requestParameters,
      initOverrides,
    );
    return await response.value();
  }

  /**
   */
  async apiAiAgentsTestDeploySendPostRaw(
    requestParameters: ApiAiAgentsTestDeploySendPostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<runtime.ApiResponse<DeploySignedTestResp>> {
    if (requestParameters["deploySignedTestReq"] == null) {
      throw new runtime.RequiredError(
        "deploySignedTestReq",
        'Required parameter "deploySignedTestReq" was null or undefined when calling apiAiAgentsTestDeploySendPost().',
      );
    }

    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    headerParameters["Content-Type"] = "application/json; charset=utf-8";

    let urlPath = `/api/ai-agents/test/deploy/send`;

    const response = await this.request(
      {
        path: urlPath,
        method: "POST",
        headers: headerParameters,
        query: queryParameters,
        body: DeploySignedTestReqToJSON(
          requestParameters["deploySignedTestReq"],
        ),
      },
      initOverrides,
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      DeploySignedTestRespFromJSON(jsonValue),
    );
  }

  /**
   */
  async apiAiAgentsTestDeploySendPost(
    requestParameters: ApiAiAgentsTestDeploySendPostRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<DeploySignedTestResp> {
    const response = await this.apiAiAgentsTestDeploySendPostRaw(
      requestParameters,
      initOverrides,
    );
    return await response.value();
  }

  /**
   */
  async apiAiAgentsTestWalletPostRaw(
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<runtime.ApiResponse<CreateTestwalletResp>> {
    const queryParameters: any = {};

    const headerParameters: runtime.HTTPHeaders = {};

    let urlPath = `/api/ai-agents/test/wallet`;

    const response = await this.request(
      {
        path: urlPath,
        method: "POST",
        headers: headerParameters,
        query: queryParameters,
      },
      initOverrides,
    );

    return new runtime.JSONApiResponse(response, (jsonValue) =>
      CreateTestwalletRespFromJSON(jsonValue),
    );
  }

  /**
   */
  async apiAiAgentsTestWalletPost(
    initOverrides?: RequestInit | runtime.InitOverrideFunction,
  ): Promise<CreateTestwalletResp> {
    const response = await this.apiAiAgentsTestWalletPostRaw(initOverrides);
    return await response.value();
  }
}
