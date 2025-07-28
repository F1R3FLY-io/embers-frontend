import { secp256k1 } from "@noble/curves/secp256k1";
import { base16 } from "@scure/base";

import { Address } from "./Address";
import { type PrivateKey } from "./PrivateKey";

export class PublicKey {
  private constructor(public readonly value: Uint8Array) {}

  public static fromPrivateKey(key: PrivateKey): PublicKey {
    const publicKey = secp256k1.getPublicKey(key.value, false);
    return new PublicKey(publicKey);
  }

  public static tryFrom(value: Uint8Array): PublicKey {
    if (!secp256k1.utils.isValidPublicKey(value, false)) {
      throw new Error("Invalid public key");
    }
    return new PublicKey(value);
  }

  public static tryFromHex(value: string): PublicKey {
    const bytes = base16.decode(value.toUpperCase());
    return PublicKey.tryFrom(bytes);
  }

  public getValue(): Uint8Array {
    return this.value;
  }

  public getAddress(): Address {
    return Address.fromPublicKey(this);
  }
}
