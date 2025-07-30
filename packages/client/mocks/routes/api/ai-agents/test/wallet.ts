import type { HTTP_POST } from "../../../../types/paths/api/ai-agents/test/wallet.types.js";

export const POST: HTTP_POST = ($) => {
  return $.response[200].random();
};
