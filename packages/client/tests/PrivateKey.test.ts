import { randomBytes } from "crypto";

import secp256k1 from "secp256k1";

import { PrivateKey } from "../src/entities/PrivateKey";

describe("PrivateKey class", () => {
  test("should check if private key is valid", () => {
    const privateKey = PrivateKey.new();
    expect(secp256k1.privateKeyVerify(privateKey.getValue())).toBe(true);
  });

  test("should create a valid private key from a Uint8Array", () => {
    const privateKey = PrivateKey.tryFrom(randomBytes(32));
    expect(privateKey).toBeInstanceOf(PrivateKey);
  });

  test("should throw error", () => {
    expect(() => PrivateKey.tryFrom(randomBytes(0))).toThrow(
      "Expected private key to be an Uint8Array with length 32",
    );
  });
});
