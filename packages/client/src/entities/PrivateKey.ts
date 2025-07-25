import { base16 } from "@scure/base";
import secp256k1 from "secp256k1";

import { getPublicKeyFrom } from "../functions";
import { type PublicKey } from "./PublicKey";

const RANDOM_BYTES_LENGTH = 32;

export class PrivateKey {
  static new(): PrivateKey {
    let privateKey = new Uint8Array(RANDOM_BYTES_LENGTH);
    do {
      privateKey = crypto.getRandomValues(privateKey);
    } while (!secp256k1.privateKeyVerify(privateKey));

    return new PrivateKey(privateKey);
  }

  private constructor(private value: Uint8Array) {}

  public static tryFrom(value: Uint8Array): PrivateKey {
    if (!secp256k1.privateKeyVerify(value)) {
      throw new Error("Invalid private key");
    }
    return new PrivateKey(value);
  }

  public static tryFromHex(value: string): PrivateKey {
    const bytes = base16.decode(value.toUpperCase());
    return PrivateKey.tryFrom(bytes);
  }

  public getValue(): Uint8Array {
    return this.value;
  }

  public getPublicKey(): PublicKey {
    return getPublicKeyFrom(this);
  }
}
