import { secp256k1 } from "@noble/curves/secp256k1";
import { base16 } from "@scure/base";

import { PublicKey } from "./PublicKey";

export class PrivateKey {
  public static new(): PrivateKey {
    return new PrivateKey(secp256k1.utils.randomSecretKey());
  }

  private constructor(public readonly value: Uint8Array) { }

  public static tryFrom(value: Uint8Array): PrivateKey {
    if (!secp256k1.utils.isValidSecretKey(value)) {
      throw new Error("Invalid private key");
    }
    return new PrivateKey(value);
  }

  public static tryFromHex(value: string): PrivateKey {
    const bytes = base16.decode(value.toUpperCase());
    return PrivateKey.tryFrom(bytes);
  }

  public getPublicKey(): PublicKey {
    return PublicKey.fromPrivateKey(this);
  }

  public toHex(): string {
    return base16.encode(this.value);
  }
}
