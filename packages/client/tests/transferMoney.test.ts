import { blake2b } from "blakejs";
import { Address, PrivateKey } from "../src";
import {
  HTTPHeaders,
  WalletStateAndHistory,
  Transfer,
  Request,
} from "../src/api-client";
import { Amount } from "../src/entities/Amount";
import { Description } from "../src/entities/Description";
import { Wallet } from "../src/entities/Wallet";
import { getPublicKeyFrom, sign, transferMoney } from "../src/functions";
import secp256k1 from "secp256k1";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Wallet Transfer Tests", () => {
  test("transferMoney function", async () => {
    const privateKey = PrivateKey.new();
    const toAddress = Address.tryFrom(
      "1111NypGkNrhxpLKFwiZ8gLKmiwLQUyzuEe1p3nEKQCSKMvd1YHY3",
    );
    const amount = Amount.tryFrom(1000);
    const description = Description.tryFrom(
      "This is a test transfer with a valid description.",
    );

    const contract = new Uint8Array(32);
    const mockPreparePostCallback = jest.fn().mockResolvedValueOnce({
      contract,
    });
    const mockTransferSendCallback = jest.fn();

    let result = await transferMoney(
      privateKey,
      toAddress,
      amount,
      description,
      mockPreparePostCallback,
      mockTransferSendCallback,
    );

    expect(result).toBeTruthy();

    expect(mockPreparePostCallback).toHaveBeenCalledWith({
      transferReq: {
        amount: 1000,
        description: "This is a test transfer with a valid description.",
        from: expect.stringMatching(/1111/),
        to: "1111NypGkNrhxpLKFwiZ8gLKmiwLQUyzuEe1p3nEKQCSKMvd1YHY3",
      },
    });

    expect(mockTransferSendCallback).toHaveBeenCalledWith({
      signedContract: expect.objectContaining({
        sigAlgorithm: "secp256k1",
        contract: Array.from(contract),
      }),
    });

    expect(
      Uint8Array.from(
        mockTransferSendCallback.mock.calls[0][0]["signedContract"]["deployer"],
      ),
    ).toEqual(getPublicKeyFrom(privateKey).getValue());

    expect(
      secp256k1.ecdsaVerify(
        Uint8Array.from(
          mockTransferSendCallback.mock.calls[0][0]["signedContract"]["sig"],
        ),
        blake2b(contract, undefined, 32),
        getPublicKeyFrom(privateKey).getValue(),
      ),
    ).toBeTruthy();
  });

  test("Wallet.sendMoney method", async () => {
    const privateKey = PrivateKey.new();

    const wallet = new Wallet({
      host: "http://localhost",
      port: 3100,
      privateKey: privateKey,
      headers: {} as HTTPHeaders,
    });

    const address = Address.tryFrom(
      "1111NypGkNrhxpLKFwiZ8gLKmiwLQUyzuEe1p3nEKQCSKMvd1YHY3",
    );
    const amount = Amount.tryFrom(1000);
    const description = Description.tryFrom(
      "This is a test transfer with a valid description.",
    );
    const result = wallet.sendMoney(address, amount, description);

    expect(result).resolves.toBeTruthy();
  });

  test("Wallet.getWalletState method", async () => {
    const client = new Wallet({
      host: "http://localhost",
      port: 3100,
      privateKey: PrivateKey.new(),
      headers: {} as HTTPHeaders,
    });

    const result: Promise<WalletStateAndHistory> = client.getWalletState();

    expect(result).resolves.toEqual(
      expect.objectContaining<WalletStateAndHistory>({
        balance: expect.any(Number),
        requests: expect.arrayOf(
          expect.objectContaining<Request>({
            id: expect.any(String),
            date: expect.any(Date),
            amount: expect.any(Number),
            status: expect.any(String),
          }),
        ),
        exchanges: expect.arrayOf(Object),
        boosts: expect.arrayOf(expect.any(Object)),
        transfers: expect.arrayOf(
          expect.objectContaining<Transfer>({
            id: expect.any(String),
            direction: expect.any(String),
            date: expect.any(Date),
            amount: expect.any(Number),
            toAddress: expect.any(String),
            cost: expect.any(Number),
          }),
        ),
      }),
    );
  });
});
