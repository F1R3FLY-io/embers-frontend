import { PrivateKey } from "@";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { blake2b } from "blakejs";

import { signContract } from "@/functions";

test("deployContract function", () => {
  const senderPrivateKey = PrivateKey.new();
  const contract = new Uint8Array(32);

  const result = signContract(contract, senderPrivateKey);

  expect(
    secp256k1.verify(
      result.sig,
      blake2b(contract, undefined, 32),
      senderPrivateKey.getPublicKey().value,
      { format: "der", prehash: false },
    ),
  ).toBe(true);
});
