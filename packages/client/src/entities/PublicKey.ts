import * as secp256k1 from "secp256k1";

import { getAddressFrom } from "../functions";
import { Address } from "./Address";

export class PublicKey {
  private constructor(private value: Uint8Array) {}

  public static tryFrom(value: Uint8Array) {
    if (!secp256k1.publicKeyVerify(value)) {
      throw new Error("Invalid public key");
    }
    return new PublicKey(value);
  }

  public getValue(): Uint8Array {
    return this.value;
  }

  public getAddressFrom(): Address {
    return getAddressFrom(this);
  }
}
