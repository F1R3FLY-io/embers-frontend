import { secp256k1 } from "@noble/curves/secp256k1.js";
import { base16 } from "@scure/base";
import { blake2b } from "blakejs";
import { createModel } from "js-crc";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { encode } from "z32";

import type { PrivateKey } from "./PrivateKey";

import { Address } from "./Address";

const CRC14 = createModel({
  init: 0x0000,
  poly: 0x4805,
  refin: false,
  refout: false,
  width: 14,
  xorout: 0x0000,
});

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

  public toHex(): string {
    return base16.encode(this.value);
  }

  public getAddress(): Address {
    return Address.fromPublicKey(this);
  }

  public getUri(): string {
    const keyHash = blake2b(this.value, undefined, 32);
    const crc = CRC14.array(keyHash);

    // little endian
    const crcLe0 = crc[1];
    const crcLe1 = crc[0];

    const bytes = new Uint8Array([...keyHash, crcLe0, (crcLe1 << 2) & 0xff]);
    const encoded = encode(bytes).slice(0, 270 / 5);

    return `rho:id:${encoded}`;
  }
}
