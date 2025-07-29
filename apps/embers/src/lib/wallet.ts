import { secp256k1 } from "@noble/curves/secp256k1";
import { base16, base58 } from "@scure/base";
import { blake2b, blake2bHex } from "blakejs";
import { keccak256 } from "js-sha3";

export type Wallet = {
  address: string;
  key: Uint8Array;
};

export const TOKENS = {
  firecap: {
    id: "000000",
    version: "00",
  },
};

export function fromPrivateKey(key: Uint8Array): Wallet {
  const publicKey = secp256k1.getPublicKey(key, false);

  const publicKeyHash = keccak256(publicKey.slice(1)).slice(-40).toUpperCase();
  const ethHash = keccak256(base16.decode(publicKeyHash)).toUpperCase();

  const token = TOKENS.firecap.id;
  const version = TOKENS.firecap.version;
  const payload = `${token}${version}${ethHash}`;

  const payloadBytes = base16.decode(payload);
  const checksum = blake2bHex(payloadBytes, undefined, 32)
    .slice(0, 8)
    .toUpperCase();

  const address = base58.encode(base16.decode(payload + checksum));

  return {
    address,
    key,
  };
}

export function fromPrivateKeyHex(key: string): Wallet {
  return fromPrivateKey(base16.decode(key));
}

export type Signed = {
  deployer: Uint8Array;
  sigAlgorithm: string;
  signature: Uint8Array;
};

export function signPayload(key: Uint8Array, payload: Uint8Array): Signed {
  const signature = secp256k1
    .sign(blake2b(payload, undefined, 32), key)
    .toBytes("der");

  const deployer = secp256k1.getPublicKey(key, false);

  return {
    deployer,
    sigAlgorithm: "secp256k1",
    signature,
  };
}
