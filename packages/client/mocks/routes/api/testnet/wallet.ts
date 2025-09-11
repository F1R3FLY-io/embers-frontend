import type { HTTP_POST } from "../../../types/paths/api/testnet/wallet.types.js";

export const POST: HTTP_POST = ($) => {
  return $.response[200].random();
};
