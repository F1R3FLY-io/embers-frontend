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

  test("should generate valid uri", () => {
    const publicKey = PublicKey.tryFromHex(
      "04c71f6c7b87edf4bec14f16f715ee49c6fea918549abdf06c734d384b60ba922990317cc4bf68da8c85b455a65595cf7007f1e54bfd6be26ffee53d1ea6d7406b",
    );
    expect(publicKey.getUri()).toBe(
      "rho:id:qrh6mgfp5z6orgchgszyxnuonanz7hw3amgrprqtciia6astt66ypn",
    );
  });
});
