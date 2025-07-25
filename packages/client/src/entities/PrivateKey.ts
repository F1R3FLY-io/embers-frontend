import { randomBytes } from "crypto";
import * as secp256k1 from "secp256k1";

import { getPublicKeyFrom } from "../functions";
import { PublicKey } from "./PublicKey";

const RANDOM_BYTES_LENGTH = 32;

export class PrivateKey {
  static new(): PrivateKey {
    let privateKey;
    do {
      privateKey = randomBytes(RANDOM_BYTES_LENGTH);
    } while (!secp256k1.privateKeyVerify(privateKey));

    return new PrivateKey(privateKey);
  }

  private constructor(private value: Uint8Array) {}

  public static tryFrom(value: Uint8Array) {
    if (!secp256k1.privateKeyVerify(value)) {
      throw new Error("Invalid private key");
    }
    return new PrivateKey(value);
  }

  public getValue(): Uint8Array {
    return this.value;
  }

  public getPublicKeyFrom(): PublicKey {
    return getPublicKeyFrom(this);
  }
}
