import { secp256k1 } from "@noble/curves/secp256k1";
import { blake2b } from "blakejs";

import type { DeployContractCallback, GetContractCallback } from "../src/functions";

import { PrivateKey } from "../src";
import { deployContract } from "../src/functions";

test("transferTokens function", async () => {
    const senderPrivateKey = PrivateKey.new();
    const senderPublicKey = senderPrivateKey.getPublicKey();

    const contract = new Uint8Array(32);
    const expectedSignature = secp256k1
        .sign(blake2b(contract, undefined, 32), senderPrivateKey.value)
        .toBytes("der");
    const mockPreparePostCallback = jest
        .fn<ReturnType<GetContractCallback>, Parameters<GetContractCallback>>()
        .mockResolvedValueOnce(
            contract,
        );
    const mockTransferSendCallback = jest.fn<
        ReturnType<DeployContractCallback>,
        Parameters<DeployContractCallback>
    >();

    const result = await deployContract(
        senderPrivateKey,
        mockPreparePostCallback,
        mockTransferSendCallback,
    );

    expect(result).toBeTruthy();

    expect(mockPreparePostCallback).toHaveBeenCalledWith();

    expect(mockTransferSendCallback).toHaveBeenCalledWith({
        contract,
        sig: expectedSignature,
        sigAlgorithm: "secp256k1",
    });

    const signature = secp256k1.Signature.fromBytes(
        mockTransferSendCallback.mock.calls[0][0].sig,
        "der",
    ).toBytes();

    expect(
        secp256k1.verify(
            signature,
            blake2b(contract, undefined, 32),
            senderPublicKey.value,
        ),
    ).toBe(true);
});