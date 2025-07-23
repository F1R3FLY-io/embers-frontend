import { randomBytes } from "crypto";
import { PublicKey } from "../src";

describe("PublicKey class", () => {
  test("should create a new PublicKey", () => {
    const publicKey = PublicKey.fromUint8Array(
      Uint8Array.from(randomBytes(33)),
    );
    expect(publicKey).toBeInstanceOf(PublicKey);
  });

  test("should throw an error", () => {
    expect(() =>
      PublicKey.fromUint8Array(Uint8Array.from([1, 2, 3, 4])),
    ).toThrow("Expected public key to be an Uint8Array with length [33, 65]");
  });
});
