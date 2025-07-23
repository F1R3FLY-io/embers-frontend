import { base16, base58 } from "@scure/base";
import { blake2b, blake2bHex } from "blakejs";
import creawteKeccakHash from "keccak";
import secp256k1 from "secp256k1";

import { Configuration, WalletsApi } from "./api-client";
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

    return checksum.every((byte, index) => byte === checksumCalc[index]);
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
  deployer: Uint8Array<ArrayBufferLike>;
  signature: Uint8Array<ArrayBufferLike>;
} {
  const { signature } = secp256k1.ecdsaSign(payload, key.getValue());

  const deployer = secp256k1.publicKeyCreate(key.getValue(), false);

  return {
    sigAlgorithm: "secp256k1",
    deployer,
    signature,
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
  const publicKeyHash = publicKey.getHash();
  const decodedPublicKeysHash = base16.decode(publicKeyHash);
  const ethHash = creawteKeccakHash("keccak256")
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
export async function getWalletState(address: Address, client?: WalletsApi) {
  return (
    client || new WalletsApi(new Configuration())
  ).apiWalletsAddressStateGet({
    address: address.getValue(),
  });
}

type PreparePostCallback = (value: {
  transferReq: {
    from: string;
    to: string;
    amount: number;
    description: string;
  };
}) => Promise<{ contract: Array<number> }>;

type TransferSendCallback = (value: {
  signedContract: {
    contract: Array<number>;
    sig: Array<number>;
    sigAlgorithm: string;
    deployer: Array<number>;
  };
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
  preparePostCallback: PreparePostCallback,
  transferSendCallback: TransferSendCallback,
) {
  const response = await preparePostCallback({
    transferReq: {
      from: generateAddressFrom(privateKey).getValue(),
      to: toAddress.getValue(),
      amount: amount.getValue(),
      description: description.getValue(),
    },
  });

  const contract = new Uint8Array(response.contract);
  const payload = blake2b(contract, undefined, 32);

  const signedContract = sign(payload, privateKey);

  await transferSendCallback({
    signedContract: {
      contract: Array.from(contract),
      sig: Array.from(signedContract.signature),
      sigAlgorithm: signedContract.sigAlgorithm,
      deployer: Array.from(signedContract.deployer),
    },
  });

  return true;
}
