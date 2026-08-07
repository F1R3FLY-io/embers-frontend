import type { FetchAPI, HTTPHeaders, Middleware } from "../api-client";
import type { QueryCallConfig } from "../entities/HttpCallConfigs";

import { Configuration, TestnetApi } from "../api-client";
import { PrivateKey } from "../entities/PrivateKey";
import { signContract } from "../functions";

export type TestnetConfig = {
  basePath: string;
  fetchApi?: FetchAPI;
  headers?: HTTPHeaders;
  middleware?: Middleware[];
};

export class TestnetApiSdk {
  private client: TestnetApi;

  public constructor(config: TestnetConfig) {
    const configuration = new Configuration({
      basePath: config.basePath,
      fetchApi: config.fetchApi,
      headers: config.headers,
      middleware: config.middleware,
    });

    this.client = new TestnetApi(configuration);
  }

  /**
   * Deploys an AI agent test.
   * @param testKey The private key for testnet
   * @param test The testcase
   * @param env The code that being tested
   */
  public async deploy(
    testKey: PrivateKey,
    test: string,
    env?: string,
    config?: QueryCallConfig,
  ) {
    const prepareRequest = {
      env,
      test,
    };

    const prepareResponse = await this.client.testnetPrepareDeploy(
      {
        deployTestReq: prepareRequest,
      },
      { signal: config?.signal },
    );

    const signedTestContract = signContract(
      prepareResponse.response.testContract,
      testKey,
    );
    const signedEnvContract =
      prepareResponse.response.envContract &&
      signContract(prepareResponse.response.envContract, testKey);

    return this.client.testnetSendDeploy(
      {
        sendRequestBodyDeploySignedTestReqDeployTestReqDeployTestResp: {
          prepareRequest,
          prepareResponse: prepareResponse.response,
          request: {
            env: signedEnvContract,
            test: signedTestContract,
          },
          token: prepareResponse.token,
        },
      },
      { signal: config?.signal },
    );
  }

  /**
   * Generate new test wallet private key
   * @returns Wallet key
   */
  public async getWallet(config?: QueryCallConfig) {
    const { key } = await this.client.testnetCreateWallet({
      signal: config?.signal,
    });
    return PrivateKey.tryFromHex(key);
  }
}
