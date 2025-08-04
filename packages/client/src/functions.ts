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
  const sig = secp256k1.sign(payload, key.value).toBytes("der");

  return {
    sig,
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

export type GetContractCallback = () => Promise<Uint8Array>;

export type DeployContractCallback = (value: {
  contract: Uint8Array;
  sig: Uint8Array;
  sigAlgorithm: string;
}) => Promise<void>;

/**
 * Transfers tokens from one address to another.
 * This function prepares a transfer contract, signs it with the provided private key,
 * and sends the signed contract to the wallet API. GetContractCallback is used to prepare the contract, transferTokensCallback is used to send the signed contract.
 *
 * @param privateKey - The private key of the sender's wallet.
 * @returns A promise that resolves when the transfer is sent.
 * @todo simplify getContractCallback
 */
export async function deployContract(
  privateKey: PrivateKey,
  getContractCallback: GetContractCallback,
  transferTokensCallback: DeployContractCallback,
) {
  const contract = await getContractCallback();

  const payload = blake2b(contract, undefined, 32);

  const { sig, sigAlgorithm } = sign(payload, privateKey);

  await transferTokensCallback({
    contract,
    sig,
    sigAlgorithm,
  });

  return true;
}
