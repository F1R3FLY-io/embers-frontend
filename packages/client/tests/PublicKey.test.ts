import { secp256k1 } from "@noble/curves/secp256k1";

import { PrivateKey, PublicKey } from "../src/index";

describe("PublicKey class", () => {
  test("should create a new PublicKey", () => {
    const privateKey = PrivateKey.new();
    const publicKey = PublicKey.tryFrom(privateKey.getPublicKey().getValue());
    expect(secp256k1.utils.isValidPublicKey(publicKey.getValue())).toBe(true);
  });

  test("should throw an error", () => {
    expect(() => PublicKey.tryFrom(Uint8Array.from([1, 2, 3, 4]))).toThrow(
      "Invalid public key",
    );
  });
});
