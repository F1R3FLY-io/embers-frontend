import { base16 } from "@scure/base";
import secp256k1 from "secp256k1";

import type { Address } from "./Address";

import { getAddressFrom } from "../functions";

export class PublicKey {
  private constructor(private value: Uint8Array) {}

  public static tryFrom(value: Uint8Array): PublicKey {
    if (!secp256k1.publicKeyVerify(value)) {
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
    return getAddressFrom(this);
  }
}
