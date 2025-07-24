import { base16, base58 } from "@scure/base";
import { blake2b, blake2bHex } from "blakejs";
import createKeccakHash from "keccak";
import * as secp256k1 from "secp256k1";

import { WalletsApi } from "./api-client/index";
import { Address } from "./entities/Address";
import { Amount } from "./entities/Amount";
import { Description } from "./entities/Description";
import { PrivateKey } from "./entities/PrivateKey";
import { PublicKey } from "./entities/PublicKey";

export const F1R3CAP_TOKE_ID = "000000";
export const F1R3CAP_VERSION = "00";

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
      (byte: unknown, index: number) => byte === checksumCalc?.[index],
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
  sigAlgorithm: "secp256k1";
  sig: Uint8Array<ArrayBufferLike>;
} {
  const sig = secp256k1.signatureExport(
    secp256k1.ecdsaSign(payload, key.getValue()).signature,
  );

  return {
    sigAlgorithm: "secp256k1",
    sig,
  };
}

/**
 * Derives an F1R3Cap address from a public key.
 * The address is constructed using a specific token ID, version, and the public key hash.
 * It also includes a checksum for validation.
 *
 * @param publicKey - The public key from which to derive the address.
 * @returns The derived F1R3Cap address as an Address object.
 */
export function getAddressFrom(publicKey: PublicKey): Address {
  const value = publicKey.getValue().slice(1, -40);
  const publicKeyHash = createKeccakHash("keccak256")
    .update(Buffer.from(value))
    .digest("hex")
    .toUpperCase();

  const decodedPublicKeysHash = base16.decode(publicKeyHash);
  const ethHash = createKeccakHash("keccak256")
    .update(Buffer.from(decodedPublicKeysHash))
    .digest("hex")
    .toUpperCase();

  const payload = `${F1R3CAP_TOKE_ID}${F1R3CAP_VERSION}${ethHash}`;

  const payloadBytes = base16.decode(payload);
  const checksum = blake2bHex(payloadBytes, undefined, 32)
    .slice(0, 8)
    .toUpperCase();

  return Address.tryFrom(base58.encode(base16.decode(payload + checksum)));
}

/**
 * Derives a public key from a private key using the secp256k1 algorithm.
 * @param key - The private key from which to derive the public key.
 * @returns The derived public key as a PublicKey object.
 */
export function getPublicKeyFrom(key: PrivateKey) {
  return PublicKey.tryFrom(secp256k1.publicKeyCreate(key.getValue(), false));
}

/**
 * Generates an F1R3Cap address directly from a private key.
 * @param key - The private key from which to generate the address.
 * @returns The derived F1R3Cap address as an Address object.
 */
export function generateAddressFrom(key: PrivateKey): Address {
  const publicKey = getPublicKeyFrom(key);
  return getAddressFrom(publicKey);
}

/**
 * Return Wallet State for a given address.
 * @param address - The address to check the wallet state for.
 * @returns A promise that resolves to the wallet state.
 */
export async function getWalletState(address: Address, client: WalletsApi) {
  return client.apiWalletsAddressStateGet({
    address: address.getValue(),
  });
}

export type GetContractCallback = (value: {
  from: Address;
  to: Address;
  amount: Amount;
  description: Description;
}) => Promise<{ contract: Array<number> }>;

export type TransferTokensCallback = (value: {
  contract: Uint8Array<ArrayBufferLike>;
  sig: Uint8Array<ArrayBufferLike>;
  sigAlgorithm: string;
}) => Promise<void>;

/**
 * Transfers tokens from one address to another.
 * This function prepares a transfer contract, signs it with the provided private key,
 * and sends the signed contract to the wallet API.
 *
 * @param privateKey - The private key of the sender's wallet.
 * @param toAddress - The address of the recipient.
 * @param amount - The amount of tokens to transfer.
 * @param description - A description of the transfer.
 * @returns A promise that resolves when the transfer is sent.
 */
export async function transferTokens(
  privateKey: PrivateKey,
  toAddress: Address,
  amount: Amount,
  description: Description,
  getContractCallback: GetContractCallback,
  transferTokensCallback: TransferTokensCallback,
) {
  const response = await getContractCallback({
    from: privateKey.getPublicKeyFrom().getAddressFrom(),
    to: toAddress,
    amount: amount,
    description: description,
  });

  const contract = new Uint8Array(response.contract);
  const payload = blake2b(contract, undefined, 32);

  const { sig, sigAlgorithm } = sign(payload, privateKey);

  await transferTokensCallback({
    contract,
    sig,
    sigAlgorithm,
  });

  return true;
}
