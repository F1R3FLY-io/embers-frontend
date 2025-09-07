import { secp256k1 } from "@noble/curves/secp256k1";
import { base58 } from "@scure/base";
import { blake2b } from "blakejs";

import type { WalletsApi } from "./api-client/index";
import type { Address } from "./entities/Address";
import type { PrivateKey } from "./entities/PrivateKey";

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
 * Updated for consist_pre-push_local-build branch with modern API.
 * @param payload - The payload to sign, typically a hash of the transaction data.
 * @param key - The private key to sign the payload with.
 * @returns An object containing the signature algorithm, the deployer public key, and the signature.
 */
export function sign(
  payload: Uint8Array,
  key: PrivateKey,
): {
  sig: Uint8Array;
  sigAlgorithm: "secp256k1";
} {
  const sig = secp256k1.sign(payload, key.value);

  // The signature object may have different methods depending on the version
  interface SignatureWithCompactBytes {
    toCompactBytes: () => Uint8Array;
  }

  // Handle both old and new signature formats
  const sigBytes: Uint8Array =
    "toCompactBytes" in sig
      ? (sig as SignatureWithCompactBytes).toCompactBytes()
      : sig;

  return {
    sig: sigBytes,
    sigAlgorithm: "secp256k1",
  };
}

/**
 * Return Wallet State for a given address.
 * @param address - The address to check the wallet state for.
 * @returns A promise that resolves to the wallet state.
 */
export async function getWalletState(address: Address, client: WalletsApi) {
  return client.apiWalletsAddressStateGet({
    address: address.value,
  });
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
  const generateModel = await getContractCallback();

  const payload = blake2b(generateModel.contract, undefined, 32);
  const { sig, sigAlgorithm } = sign(payload, privateKey);

  const deployModel = await deployContractCallback(
    generateModel.contract,
    sig,
    sigAlgorithm,
  );

  return { deployModel, generateModel };
}
