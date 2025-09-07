import { base58 } from "@scure/base";
import { blake2b } from "blakejs";
import sha3 from "js-sha3";
const { keccak256 } = sha3;

import type { PublicKey } from "./PublicKey";

import { verifyAddress } from "../functions";

export const F1R3CAP_TOKE_ID = [0, 0, 0];
export const F1R3CAP_VERSION = [0];

/**
 * Address entity representing a blockchain address.
 */
export class Address {
  /**
   * Constructor for Address
   * @param value String representing an address.
   */
  private constructor(public readonly value: string) {}

  /**
   * Derives an F1R3Cap address from a public key.
   * The address is constructed using a specific token ID, version, and the public key hash.
   * It also includes a checksum for validation.
   *
   * @param publicKey - The public key from which to derive the address.
   * @returns The derived F1R3Cap address as an Address object.
   */
  public static fromPublicKey(publicKey: PublicKey): Address {
    const value = publicKey.value.slice(1);
    const publicKeyHash = keccak256.digest(value).slice(-20);
    const ethHash = keccak256.digest(publicKeyHash);

    const payloadBytes = new Uint8Array(
      [F1R3CAP_TOKE_ID, F1R3CAP_VERSION, ethHash].flat(),
    );
    const checksum = blake2b(payloadBytes, undefined, 32).slice(0, 4);

    const addressBytes = new Uint8Array(
      [Array.from(payloadBytes), Array.from(checksum)].flat(),
    );
    return new Address(base58.encode(addressBytes));
  }

  /**
   * Create an Address instance from a string.
   * @param address String representing an address.
   * @returns Address Address instance created from the string
   * @throws Error if the address is invalid
   */
  public static tryFrom(address: string): Address {
    if (verifyAddress(address)) {
      return new Address(address);
    }
    throw new Error("Invalid address");
  }
}
