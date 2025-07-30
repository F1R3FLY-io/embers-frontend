import type { HTTP_POST } from "../../../../../types/paths/api/ai-agents/{id}/save/prepare.types.js";

export const POST: HTTP_POST = ($) => {
  return $.response[200].random();
};
