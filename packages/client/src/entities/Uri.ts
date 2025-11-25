import { blake2b } from "blakejs";
import { createModel } from "js-crc";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { decode, encode } from "z32";

import type { PublicKey } from "./PublicKey";

const CRC14 = createModel({
  init: 0x0000,
  poly: 0x4805,
  refin: false,
  refout: false,
  width: 14,
  xorout: 0x0000,
});

const URI_PREFIX = "rho:id:";

export class Uri {
  private constructor(public readonly value: string) {}

  public static fromPublicKey(key: PublicKey): Uri {
    const keyHash = blake2b(key.value, undefined, 32);
    const crc = CRC14.array(keyHash);

    // convert to little endian
    const crcLe0 = crc[1];
    const crcLe1 = crc[0];

    const bytes = new Uint8Array([...keyHash, crcLe0, (crcLe1 << 2) & 0xff]);
    const encoded = encode(bytes).slice(0, 270 / 5);

    return new Uri(`${URI_PREFIX}${encoded}`);
  }

  public static tryFrom(uri: string): Uri {
    if (!uri.startsWith(URI_PREFIX)) {
      throw new Error("invalid uri prefix");
    }

    const encoded = uri.slice(URI_PREFIX.length);
    const decoded = decode(encoded);
    if (decoded.length !== 34) {
      throw new Error("invalid decoded bytes length");
    }

    const keyHash = decoded.slice(0, 32);

    // convert to big endian
    const crc = [decoded.at(33)! >> 2, decoded.at(32)];
    const expected = CRC14.array(keyHash);

    if (expected[0] !== crc[0] || expected[1] !== crc[1]) {
      throw new Error("checksum mistmatch");
    }

    return new Uri(uri);
  }

  public toString() {
    return this.value;
  }
}
