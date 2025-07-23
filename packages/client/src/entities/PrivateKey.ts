import { randomBytes } from "crypto";

import secp256k1 from "secp256k1";

const RANDOM_BYTES_LENGTH = 32;

export class PrivateKey {
  static new() {
    let privateKey;
    do {
      privateKey = randomBytes(RANDOM_BYTES_LENGTH);
    } while (!secp256k1.privateKeyVerify(privateKey));

    return new PrivateKey(privateKey);
  }

  private constructor(private value: Uint8Array) {}

  public static fromUint8Array(value: Uint8Array) {
    secp256k1.privateKeyVerify(value);
    return new PrivateKey(value);
  }

  public getValue(): Uint8Array {
    return this.value;
  }

  private toString() {}
}
