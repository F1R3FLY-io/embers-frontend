import type { HTTP_POST } from "../../../../types/paths/api/ai-agents/test/wallet.types.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { bytesToHex } from "@noble/curves/utils.js";

export const POST: HTTP_POST = ($) => {
  return $.response[200].json({
    key: bytesToHex(secp256k1.utils.randomSecretKey()),
  });
};
