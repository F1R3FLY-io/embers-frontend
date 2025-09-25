import { PrivateKey, PublicKey } from "@";
import { secp256k1 } from "@noble/curves/secp256k1.js";

describe("PublicKey class", () => {
  test("should create a new PublicKey", () => {
    const privateKey = PrivateKey.new();
    const publicKey = PublicKey.tryFrom(privateKey.getPublicKey().value);
    expect(secp256k1.utils.isValidPublicKey(publicKey.value)).toBe(true);
  });

  test("should throw an error", () => {
    expect(() => PublicKey.tryFrom(Uint8Array.from([1, 2, 3, 4]))).toThrow(
      "Invalid public key",
    );
  });

  test("should create a PublicKey from a hex string", () => {
    const privateKey = PrivateKey.new();
    const publicKey = PublicKey.tryFromHex(privateKey.getPublicKey().toHex());
    expect(secp256k1.utils.isValidPublicKey(publicKey.value)).toBe(true);
  });
});
