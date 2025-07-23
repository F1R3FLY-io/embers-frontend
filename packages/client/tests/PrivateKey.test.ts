import { randomBytes } from "crypto";

import { PrivateKey } from "../src/entities/PrivateKey";

describe("PrivateKey class", () => {
  test("should create a valid private key", () => {
    const privateKey = PrivateKey.new();
    expect(privateKey).toBeInstanceOf(PrivateKey);
  });

  test("should create a valid private key from a string", () => {
    const privateKey = PrivateKey.tryFrom(randomBytes(32));
    expect(privateKey).toBeInstanceOf(PrivateKey);
  });

  test("should throw error", () => {
    expect(() => PrivateKey.tryFrom(randomBytes(0))).toThrow(
      "Expected private key to be an Uint8Array with length 32",
    );
  });
});
