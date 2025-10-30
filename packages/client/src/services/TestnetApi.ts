import type { HTTPHeaders } from "@/api-client";

import { Configuration, TestnetApi } from "@/api-client";
import { signContract } from "@/functions";

import { PrivateKey } from "../entities/PrivateKey";

export type TestnetConfig = {
  basePath: string;
  headers?: HTTPHeaders;
};

export class TestnetApiSdk {
  private client: TestnetApi;

  public constructor(config: TestnetConfig) {
    const configuration = new Configuration({
      basePath: config.basePath,
      headers: config.headers,
    });

    this.client = new TestnetApi(configuration);
  }

  /**
   * Deploys an AI agent test.
   * @param testKey The private key for testnet
   * @param test The testcase
   * @param env The code that being tested
   */
  public async deploy(testKey: PrivateKey, test: string, env?: string) {
    const response = await this.client.apiTestnetDeployPreparePost({
      deployTestReq: {
        env,
        test,
      },
    });

    const signedTestContract = signContract(response.testContract, testKey);
    const signedEnvContract =
      response.envContract && signContract(response.envContract, testKey);

    return this.client.apiTestnetDeploySendPost({
      deploySignedTestReq: {
        env: signedEnvContract,
        test: signedTestContract,
      },
    });
  }

  /**
   * Generate new test wallet private key
   * @returns Wallet key
   */
  public async getWallet() {
    const { key } = await this.client.apiTestnetWalletPost();
    return PrivateKey.tryFromHex(key);
  }
}
