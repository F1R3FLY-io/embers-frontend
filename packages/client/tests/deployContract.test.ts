// @ts-ignore
import { jest, test, expect } from "@jest/globals";
import { secp256k1 } from "@noble/curves/secp256k1";
import { blake2b } from "blakejs";

import type {
  DeployContractCallback,
  GetContractCallback,
} from "../src/functions";

import { PrivateKey } from "../src";
import { deployContract } from "../src/functions";

test("deployContract function", async () => {
  const senderPrivateKey = PrivateKey.new();
  const senderPublicKey = senderPrivateKey.getPublicKey();

  const contract = new Uint8Array(32);
  const expectedSignature = secp256k1.sign(
    blake2b(contract, undefined, 32),
    senderPrivateKey.value,
  );
  const mockPreparePostCallback = jest
    .fn<
      ReturnType<GetContractCallback<{ contract: Uint8Array<ArrayBuffer> }>>,
      Parameters<GetContractCallback<{ contract: Uint8Array<ArrayBuffer> }>>
    >()
    .mockResolvedValueOnce({ contract });
  const mockTransferSendCallback = jest
    .fn<
      ReturnType<DeployContractCallback<boolean>>,
      Parameters<DeployContractCallback<boolean>>
    >()
    .mockResolvedValueOnce(true);

  const result = await deployContract(
    senderPrivateKey,
    mockPreparePostCallback,
    mockTransferSendCallback,
  );

  expect(result).toBeTruthy();

  expect(mockPreparePostCallback).toHaveBeenCalledWith();

  expect(mockTransferSendCallback).toHaveBeenCalledWith(
    contract,
    expectedSignature,
    "secp256k1",
  );

  const signature = mockTransferSendCallback.mock.calls[0][1];

  expect(
    secp256k1.verify(
      signature,
      blake2b(contract, undefined, 32),
      senderPublicKey.value,
    ),
  ).toBe(true);
});
