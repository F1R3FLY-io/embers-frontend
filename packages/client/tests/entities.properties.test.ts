import { secp256k1 } from "@noble/curves/secp256k1.js";
import { base58 } from "@scure/base";

import { Address } from "@/entities/Address";
import { Amount, MAX_AMOUNT } from "@/entities/Amount";
import { PrivateKey } from "@/entities/PrivateKey";
import { PublicKey } from "@/entities/PublicKey";
import { Uri } from "@/entities/Uri";
import { verifyAddress } from "@/functions";

import { fc } from "./helpers/fc";

// Laws the entity types must obey for every value, not just the handful an
// example test happens to name.
//
// These are the codecs standing between a user's key and an on-chain identity.
// An example test shows one address round-trips; a property shows that no
// representable key produces an address that fails its own checksum, and that
// no single-byte corruption slips past it. The difference matters here because
// the failure mode is silent: a wrong address is a well-formed string that
// sends value somewhere unrecoverable.
//
// Property tests state a law and let the library hunt for a counterexample, so
// a failure prints the minimal input that breaks it (Claessen and Hughes,
// doi:10.1145/351240.351266).

/** Every valid secp256k1 secret: a scalar in [1, n). */
const privateKeyArb = fc
  .bigInt({ max: secp256k1.Point.Fn.ORDER - 1n, min: 1n })
  .map((scalar) => {
    const bytes = new Uint8Array(32);
    let remaining = scalar;
    for (let index = 31; index >= 0; index -= 1) {
      bytes[index] = Number(remaining & 0xffn);
      remaining >>= 8n;
    }
    return PrivateKey.tryFrom(bytes);
  });

describe("PrivateKey", () => {
  it("round-trips through hex for every valid secret", () => {
    fc.assert(
      fc.property(privateKeyArb, (key) => {
        expect(PrivateKey.tryFromHex(key.toHex()).value).toEqual(key.value);
      }),
    );
  });

  it("accepts either case of the same hex", () => {
    fc.assert(
      fc.property(privateKeyArb, (key) => {
        const hex = key.toHex();
        expect(PrivateKey.tryFromHex(hex.toLowerCase()).value).toEqual(
          key.value,
        );
      }),
    );
  });

  it("rejects anything that is not a 32-byte scalar below the curve order", () => {
    const invalid = fc.oneof(
      // Zero and the order itself are the two boundary values the curve
      // excludes; a key at either would produce a point at infinity.
      fc.constant(new Uint8Array(32)),
      fc.constant(scalarBytes(secp256k1.Point.Fn.ORDER)),
      fc.constant(scalarBytes(secp256k1.Point.Fn.ORDER + 1n)),
      fc.uint8Array({ maxLength: 31 }),
      fc.uint8Array({ maxLength: 64, minLength: 33 }),
    );

    fc.assert(
      fc.property(invalid, (bytes) => {
        expect(() => PrivateKey.tryFrom(bytes)).toThrow();
      }),
    );
  });
});

describe("Address", () => {
  it("derives an address that passes its own checksum, for every key", () => {
    fc.assert(
      fc.property(privateKeyArb, (key) => {
        const address = Address.fromPublicKey(key.getPublicKey());
        expect(verifyAddress(address.toString())).toBe(true);
      }),
    );
  });

  it("accepts its own output through tryFrom", () => {
    fc.assert(
      fc.property(privateKeyArb, (key) => {
        const address = Address.fromPublicKey(key.getPublicKey()).toString();
        expect(Address.tryFrom(address).toString()).toBe(address);
      }),
    );
  });

  it("detects a single corrupted byte", () => {
    fc.assert(
      fc.property(
        privateKeyArb,
        fc.nat(),
        fc.integer({ max: 255, min: 1 }),
        (key, position, delta) => {
          const address = Address.fromPublicKey(key.getPublicKey()).toString();
          const bytes = base58.decode(address);
          const index = position % bytes.length;
          const corrupted = Uint8Array.from(bytes);
          corrupted[index] = (corrupted[index] + delta) % 256;

          // The checksum exists for exactly this: a mistyped or truncated
          // address must not be usable, because value sent to it is gone.
          expect(verifyAddress(base58.encode(corrupted))).toBe(false);
        },
      ),
    );
  });

  it("never throws on arbitrary input, it answers false", () => {
    fc.assert(
      fc.property(fc.string(), (value) => {
        expect(typeof verifyAddress(value)).toBe("boolean");
      }),
    );
  });

  it("derives distinct addresses for distinct keys", () => {
    fc.assert(
      fc.property(privateKeyArb, privateKeyArb, (a, b) => {
        fc.pre(a.toHex() !== b.toHex());
        expect(Address.fromPublicKey(a.getPublicKey()).toString()).not.toBe(
          Address.fromPublicKey(b.getPublicKey()).toString(),
        );
      }),
    );
  });
});

describe("PublicKey", () => {
  it("round-trips through hex", () => {
    fc.assert(
      fc.property(privateKeyArb, (key) => {
        const publicKey = key.getPublicKey();
        expect(PublicKey.tryFromHex(publicKey.toHex()).value).toEqual(
          publicKey.value,
        );
      }),
    );
  });

  it("always produces an uncompressed 65-byte point", () => {
    fc.assert(
      fc.property(privateKeyArb, (key) => {
        const value = key.getPublicKey().value;
        expect(value).toHaveLength(65);
        // The 0x04 prefix is what marks it uncompressed; the address
        // derivation slices it off and would silently hash the wrong bytes if
        // the encoding ever changed.
        expect(value[0]).toBe(0x04);
      }),
    );
  });
});

describe("Uri", () => {
  it("round-trips a registry uri derived from any key", () => {
    fc.assert(
      fc.property(privateKeyArb, (key) => {
        const uri = Uri.fromPublicKey(key.getPublicKey()).toString();
        expect(Uri.tryFrom(uri).toString()).toBe(uri);
      }),
    );
  });

  it("rejects arbitrary strings rather than accepting them", () => {
    fc.assert(
      fc.property(fc.string(), (value) => {
        fc.pre(!value.startsWith("rho:id:"));
        expect(() => Uri.tryFrom(value)).toThrow();
      }),
    );
  });
});

describe("Amount", () => {
  it("accepts exactly the representable positive range", () => {
    fc.assert(
      fc.property(fc.bigInt({ max: MAX_AMOUNT, min: 1n }), (value) => {
        expect(Amount.tryFrom(value).value).toBe(value);
      }),
    );
  });

  it("rejects zero and every negative value", () => {
    fc.assert(
      fc.property(fc.bigInt({ max: 0n, min: -(2n ** 70n) }), (value) => {
        expect(() => Amount.tryFrom(value)).toThrow();
      }),
    );
  });

  it("rejects everything above the 64-bit signed ceiling", () => {
    fc.assert(
      fc.property(
        fc.bigInt({ max: 2n ** 70n, min: MAX_AMOUNT + 1n }),
        (value) => {
          // The wire carries this as a string, so an over-large amount would
          // not fail at serialization -- it would reach the chain.
          expect(() => Amount.tryFrom(value)).toThrow();
        },
      ),
    );
  });

  it("serializes without loss at any magnitude", () => {
    fc.assert(
      fc.property(fc.bigInt({ max: MAX_AMOUNT, min: 1n }), (value) => {
        expect(BigInt(Amount.tryFrom(value).toString())).toBe(value);
      }),
    );
  });
});

/** A bigint as 32 big-endian bytes, for the boundary cases above. */
function scalarBytes(scalar: bigint): Uint8Array {
  const bytes = new Uint8Array(32);
  let remaining = scalar;
  for (let index = 31; index >= 0; index -= 1) {
    bytes[index] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
  return bytes;
}
