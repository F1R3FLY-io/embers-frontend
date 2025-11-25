import { PrivateKey } from "@";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { randomBytes } from "crypto";

describe("PrivateKey class", () => {
  test("should check if private key is valid", () => {
    const privateKey = PrivateKey.new();
    expect(secp256k1.utils.isValidSecretKey(privateKey.value)).toBe(true);
  });

  test("should create a valid private key from a Uint8Array", () => {
    const validKey = PrivateKey.new();
    const privateKey = PrivateKey.tryFrom(validKey.value);
    expect(secp256k1.utils.isValidSecretKey(privateKey.value)).toBe(true);
  });

  test("should throw error", () => {
    expect(() => PrivateKey.tryFrom(randomBytes(0))).toThrow();
  });

  test("should create a private key from a hex string", () => {
    const validKey = PrivateKey.new();
    const privateKey = PrivateKey.tryFromHex(validKey.toHex());
    expect(secp256k1.utils.isValidSecretKey(privateKey.value)).toBe(true);
  });
});
