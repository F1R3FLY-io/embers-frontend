import type {
  Boost,
  Direction,
  Request,
  RequestStatus,
  Transfer,
  WalletStateAndHistory,
} from "../src/api-client";

import { PrivateKey } from "../src";
import { Amount } from "../src/entities/Amount";
import { Description } from "../src/entities/Description";
import { Wallet } from "../src/entities/Wallet";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Wallet Transfer", () => {
  test("Wallet.sendTokens method", async () => {
    const privateKey = PrivateKey.new();
    const address = privateKey.getPublicKey().getAddress();
    const amount = Amount.tryFrom(1000n);
    const description = Description.tryFrom(
      "This is a test transfer with a valid description.",
    );
    const wallet = new Wallet({
      basePath: "http://localhost:3100",
      headers: {},
      privateKey,
    });

    const result = await wallet.sendTokens(address, amount, description);

    expect(result).toBeTruthy();
  });

  test("Wallet.getWalletState method", async () => {
    const client = new Wallet({
      basePath: "http://localhost:3100",
      headers: {},
      privateKey: PrivateKey.new(),
    });

    const result = await client.getWalletState();

    expect(result).toEqual(
      expect.objectContaining<WalletStateAndHistory>({
        balance: expect.any(BigInt) as bigint,
        boosts: expect.any(Array) as Boost[],
        exchanges: expect.any(Array) as object[],
        requests: expect.any(Array) as Request[],
        transfers: expect.any(Array) as Transfer[],
      }),
    );

    expect(result.requests).toEqual(
      expect.arrayOf<Request>({
        amount: expect.any(BigInt) as bigint,
        date: expect.any(Date) as Date,
        id: expect.any(String) as string,
        status: expect.any(String) as RequestStatus,
      }),
    );

    expect(result.boosts).toEqual(
      expect.arrayOf<Boost>({
        amount: expect.any(BigInt) as bigint,
        date: expect.any(Date) as Date,
        direction: expect.any(String) as Direction,
        id: expect.any(String) as string,
        post: expect.any(String) as string,
        username: expect.any(String) as string,
      }),
    );

    expect(result.transfers).toEqual(
      expect.arrayOf<Transfer>({
        amount: expect.any(BigInt) as bigint,
        cost: expect.any(BigInt) as bigint,
        date: expect.any(Date) as Date,
        direction: expect.any(String) as Direction,
        id: expect.any(String) as string,
        toAddress: expect.any(String) as string,
      }),
    );
  });
});
