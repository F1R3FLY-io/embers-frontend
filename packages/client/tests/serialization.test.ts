import { base16 } from "@scure/base";

import { deserializeKey, PrivateKey, serializeKey } from "../src";

describe("serializeKey/deserializeKey", () => {
  it("should roundtrip private key through serialization", () => {
    const originalKey = PrivateKey.new();
    const serialized = serializeKey(originalKey);
    const deserialized = deserializeKey(serialized);

    expect(base16.encode(deserialized.value)).toBe(base16.encode(originalKey.value));
  });

  it("should throw on invalid serialized content", () => {
    expect(() => deserializeKey("invalid json")).toThrow();
  });
});
