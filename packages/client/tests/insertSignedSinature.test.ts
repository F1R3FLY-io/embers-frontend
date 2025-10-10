import { PrivateKey } from "@";
import { base16 } from "@scure/base";

import { insertSignedSignature } from "@/functions";

test("insertSignedSignature function", () => {
  const timestamp = new Date(1559156356769);
  const secretKey = PrivateKey.tryFromHex(
    "f450b26bac63e5dd9343cd46f5fae1986d367a893cd21eedd98a4cb3ac699abc",
  );
  const publicKey = secretKey.getPublicKey();
  const version = 9223372036854775807n;

  const sig = insertSignedSignature(secretKey, timestamp, publicKey, version);

  expect(base16.encode(sig).toLowerCase()).toBe(
    "3044022038044777f2faccfc503363ce70d5701ae64969ca98e64049f92d8477fdea0c1402200843c073c6f0121f580f38bb2940f16cef54fc24ea325ebc00230fa6e3117549",
  );
});
