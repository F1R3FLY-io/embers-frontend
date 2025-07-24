import { blake2b } from "blakejs";
import secp256k1 from "secp256k1";

import { PrivateKey } from "../src";
import {
  HTTPHeaders,
  WalletStateAndHistory,
  Transfer,
  Request,
  Boost,
  RequestStatus,
  Direction,
} from "../src/api-client";
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
    const senderPublicKey = senderPrivateKey.getPublicKeyFrom();
    const receiverAddress = PrivateKey.new()
      .getPublicKeyFrom()
      .getAddressFrom();

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
      from: senderPublicKey.getAddressFrom(),
      to: receiverAddress,
    });

    expect(mockTransferSendCallback).toHaveBeenCalledWith({
      sigAlgorithm: "secp256k1",
      contract,
      sig: expectedSignature,
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
    const address = privateKey.getPublicKeyFrom().getAddressFrom();
    const amount = Amount.tryFrom(1000n);
    const description = Description.tryFrom(
      "This is a test transfer with a valid description.",
    );
    const wallet = new Wallet({
      host: "http://localhost",
      port: 3100,
      privateKey: privateKey,
      headers: {} as HTTPHeaders,
    });

    const result = await wallet.sendTokens(address, amount, description);

    expect(result).toBeTruthy();
  });

  test("Wallet.getWalletState method", async () => {
    const client = new Wallet({
      host: "http://localhost",
      port: 3100,
      privateKey: PrivateKey.new(),
      headers: {} as HTTPHeaders,
    });

    const result = await client.getWalletState();

    expect(result).toEqual(
      expect.objectContaining<WalletStateAndHistory>({
        balance: expect.any(Number) as number,
        requests: expect.any(Array) as Request[],
        exchanges: expect.any(Array) as object[],
        boosts: expect.any(Array) as Boost[],
        transfers: expect.any(Array) as Transfer[],
      }),
    );

    // Additional type-safe checks for array elements if they exist
    if (result.requests.length > 0) {
      expect(result.requests[0]).toEqual(
        expect.objectContaining<Request>({
          id: expect.any(String) as string,
          date: expect.any(Date) as Date,
          amount: expect.any(Number) as number,
          status: expect.any(String) as RequestStatus,
        }),
      );
    }

    if (result.boosts.length > 0) {
      expect(result.boosts[0]).toEqual(
        expect.objectContaining<Boost>({
          id: expect.any(String) as string,
          username: expect.any(String) as string,
          direction: expect.any(String) as Direction,
          date: expect.any(Date) as Date,
          amount: expect.any(Number) as number,
          post: expect.any(String) as string,
        }),
      );
    }

    if (result.transfers.length > 0) {
      expect(result.transfers[0]).toEqual(
        expect.objectContaining<Transfer>({
          id: expect.any(String) as string,
          direction: expect.any(String) as Direction,
          date: expect.any(Date) as Date,
          amount: expect.any(Number) as number,
          toAddress: expect.any(String) as string,
          cost: expect.any(Number) as number,
        }),
      );
    }
  });
});
