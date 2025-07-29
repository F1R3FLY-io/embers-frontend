import { secp256k1 } from "@noble/curves/secp256k1";
import { blake2b } from "blakejs";

import { PrivateKey } from "../src";
import {
  type Boost,
  type Direction,
  type Request,
  type RequestStatus,
  type Transfer,
  type WalletStateAndHistory,
} from "../src/api-client";
import { Amount } from "../src/entities/Amount";
import { Description } from "../src/entities/Description";
import { Wallet } from "../src/entities/Wallet";
import {
  type GetContractCallback,
  transferTokens,
  type TransferTokensCallback,
} from "../src/functions";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Wallet Transfer Tests", () => {
  test("transferTokens function", async () => {
    const senderPrivateKey = PrivateKey.new();
    const senderPublicKey = senderPrivateKey.getPublicKey();
    const receiverAddress = PrivateKey.new().getPublicKey().getAddress();

    const amount = Amount.tryFrom(1000n);
    const description = Description.tryFrom(
      "This is a test transfer with a valid description.",
    );

    const contract = new Uint8Array(32);
    const expectedSignature = secp256k1
      .sign(blake2b(contract, undefined, 32), senderPrivateKey.value)
      .toBytes("der");
    const mockPreparePostCallback = jest
      .fn<ReturnType<GetContractCallback>, Parameters<GetContractCallback>>()
      .mockResolvedValueOnce({
        contract: Array.from(contract),
      });
    const mockTransferSendCallback = jest.fn<
      ReturnType<TransferTokensCallback>,
      Parameters<TransferTokensCallback>
    >();

    const result = await transferTokens(
      senderPrivateKey,
      receiverAddress,
      amount,
      description,
      mockPreparePostCallback,
      mockTransferSendCallback,
    );

    expect(result).toBeTruthy();

    expect(mockPreparePostCallback).toHaveBeenCalledWith({
      amount,
      description,
      from: senderPublicKey.getAddress(),
      to: receiverAddress,
    });

    expect(mockTransferSendCallback).toHaveBeenCalledWith({
      contract,
      sig: expectedSignature,
      sigAlgorithm: "secp256k1",
    });

    expect(
      secp256k1.verify(
        secp256k1.Signature.fromBytes(
          mockTransferSendCallback.mock.calls[0][0].sig,
          "der",
        ),
        blake2b(contract, undefined, 32),
        senderPublicKey.getValue(),
      ),
    ).toBe(true);
  });

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

  // eslint-disable-next-line jest/no-disabled-tests
  test.skip("Wallet.getWalletState method", async () => {
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
