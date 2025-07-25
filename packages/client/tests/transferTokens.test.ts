import { blake2b } from "blakejs";
import secp256k1 from "secp256k1";

import type {
  Boost,
  Direction,
  HTTPHeaders,
  Request,
  RequestStatus,
  Transfer,
  WalletStateAndHistory,
} from "../src/api-client";

import { PrivateKey } from "../src";
import { Amount } from "../src/entities/Amount";
import { Description } from "../src/entities/Description";
import { Wallet } from "../src/entities/Wallet";
import { transferTokens } from "../src/functions";

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
    const expectedSignature = secp256k1.signatureExport(
      secp256k1.ecdsaSign(
        blake2b(contract, undefined, 32),
        senderPrivateKey.getValue(),
      ).signature,
    );
    const mockPreparePostCallback = jest.fn().mockResolvedValueOnce({
      contract,
    });
    const mockTransferSendCallback = jest.fn();

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
      secp256k1.ecdsaVerify(
        secp256k1.signatureImport(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          mockTransferSendCallback.mock.calls[0][0][
            "sig"
          ] as unknown as Uint8Array,
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
      headers: {} as HTTPHeaders,
      host: "http://localhost",
      port: 3100,
      privateKey: privateKey,
    });

    const result = await wallet.sendTokens(address, amount, description);

    expect(result).toBeTruthy();
  });

  test("Wallet.getWalletState method", async () => {
    const client = new Wallet({
      headers: {} as HTTPHeaders,
      host: "http://localhost",
      port: 3100,
      privateKey: PrivateKey.new(),
    });

    const result = await client.getWalletState();

    expect(result).toEqual(
      expect.objectContaining<WalletStateAndHistory>({
        balance: expect.any(Number) as number,
        boosts: expect.any(Array) as Boost[],
        exchanges: expect.any(Array) as object[],
        requests: expect.any(Array) as Request[],
        transfers: expect.any(Array) as Transfer[],
      }),
    );

    // Additional type-safe checks for array elements if they exist
    expect(result.requests).toEqual(
      expect.arrayOf<Request>({
        amount: expect.any(Number) as number,
        date: expect.any(Date) as Date,
        id: expect.any(String) as string,
        status: expect.any(String) as RequestStatus,
      }),
    );

    expect(result.boosts).toEqual(
      expect.arrayOf<Boost>({
        amount: expect.any(Number) as number,
        date: expect.any(Date) as Date,
        direction: expect.any(String) as Direction,
        id: expect.any(String) as string,
        post: expect.any(String) as string,
        username: expect.any(String) as string,
      }),
    );

    expect(result.transfers).toEqual(
      expect.arrayOf<Transfer>({
        amount: expect.any(Number) as number,
        cost: expect.any(Number) as number,
        date: expect.any(Date) as Date,
        direction: expect.any(String) as Direction,
        id: expect.any(String) as string,
        toAddress: expect.any(String) as string,
      }),
    );
  });
});
