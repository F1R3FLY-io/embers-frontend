import { secp256k1 } from "@noble/curves/secp256k1.js";
import { base58 } from "@scure/base";
import { blake2b } from "blakejs";

import type { PrivateKey } from "@/entities/PrivateKey";
import type { PublicKey } from "@/entities/PublicKey";

import { ETuple, Expr, Par } from "@/generated/RhoTypes";

/**
 * Verifies F1R3Cap an address by checking its checksum.
 *
 * @param value - The address to verify, encoded in base58.
 * @returns A boolean indicating whether the address is valid.
 */
export function verifyAddress(value: string): boolean {
  try {
    const revBytes = base58.decode(value);

    const payload = revBytes.slice(0, -4);
    const checksum = revBytes.slice(-4);

    const checksumCalc = blake2b(payload, undefined, 32).slice(0, 4);

    return checksum.every(
      (byte: unknown, index: number) => byte === checksumCalc[index],
    );
  } catch {
    return false;
  }
}

/**
 * Signs a payload using the specified private key.
 * This function uses the secp256k1 algorithm to create a digital signature.
 * @param payload - The payload to sign, typically a hash of the transaction data.
 * @param key - The private key to sign the payload with.
 * @returns An object containing the signature algorithm, the deployer public key, and the signature.
 */
export function sign(payload: Uint8Array, key: PrivateKey) {
  const sig = secp256k1.sign(payload, key.value, {
    format: "der",
    lowS: true,
    prehash: false,
  });

  return {
    sig,
    sigAlgorithm: "secp256k1",
  };
}

export type GetContractCallback<T> = () => Promise<T>;

export type DeployContractCallback<T> = (
  contract: Uint8Array,
  sig: Uint8Array,
  sigAlgorithm: string,
) => Promise<T>;

/**
 * Transfers tokens from one address to another.
 * This function prepares a transfer contract, signs it with the provided private key,
 * and sends the signed contract to the wallet API. GetContractCallback is used to prepare the contract, transferTokensCallback is used to send the signed contract.
 *
 * @param privateKey - The private key of the sender's wallet.
 * @returns A promise that resolves when the transfer is sent.
 */
export async function deployContract<T extends { contract: Uint8Array }, R>(
  privateKey: PrivateKey,
  getContractCallback: GetContractCallback<T>,
  deployContractCallback: DeployContractCallback<R>,
) {
  const prepareModel = await getContractCallback();

  const payload = blake2b(prepareModel.contract, undefined, 32);
  const { sig, sigAlgorithm } = sign(payload, privateKey);

  const sendModel = await deployContractCallback(
    prepareModel.contract,
    sig,
    sigAlgorithm,
  );

  return { prepareModel, sendModel };
}

export function insertSignedSignature(
  key: PrivateKey,
  timestamp: Date,
  deployerPubKey: PublicKey,
  version: bigint,
) {
  const payload = Par.encode(
    Par.create({
      exprs: [
        Expr.create({
          eTupleBody: ETuple.create({
            ps: [
              Par.create({
                exprs: [Expr.create({ gInt: BigInt(timestamp.getTime()) })],
              }),
              Par.create({
                exprs: [Expr.create({ gByteArray: deployerPubKey.value })],
              }),
              Par.create({ exprs: [Expr.create({ gInt: version })] }),
            ],
          }),
        }),
      ],
    }),
  ).finish();

  const toSign = blake2b(payload, undefined, 32);
  return sign(toSign, key).sig;
}
