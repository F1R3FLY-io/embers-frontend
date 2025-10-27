import type { HTTPHeaders } from "@/api-client";

import { Configuration, TestnetApi } from "@/api-client";
import { sign } from "@/functions";

import type { Address } from "../entities/Address";

import { PrivateKey } from "../entities/PrivateKey";

export type TestnetConfig = {
  basePath: string;
  headers?: HTTPHeaders;
  privateKey: PrivateKey;
};

export class TestnetApiSdk {
  private client: TestnetApi;

  public readonly privateKey: PrivateKey;
  public readonly address: Address;

  public constructor(config: TestnetConfig) {
    this.privateKey = config.privateKey;

    const configuration = new Configuration({
      basePath: config.basePath,
      headers: config.headers,
    });

    this.client = new TestnetApi(configuration);
    this.address = this.privateKey.getPublicKey().getAddress();
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

    const signedTestContract = sign(response.testContract, testKey);
    const signedEnvContract =
      response.envContract && sign(response.envContract, testKey);

    return this.client.apiTestnetDeploySendPost({
      deploySignedTestReq: {
        env: signedEnvContract && {
          contract: response.envContract!,
          deployer: this.privateKey.getPublicKey().value,
          sig: signedEnvContract.sig,
          sigAlgorithm: signedEnvContract.sigAlgorithm,
        },
        test: {
          contract: response.testContract,
          deployer: this.privateKey.getPublicKey().value,
          sig: signedTestContract.sig,
          sigAlgorithm: signedTestContract.sigAlgorithm,
        },
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
