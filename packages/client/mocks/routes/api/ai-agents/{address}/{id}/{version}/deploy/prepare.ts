import type { HTTP_POST } from "../../../../../../../types/paths/api/ai-agents/{address}/{id}/{version}/deploy/prepare.types.js";

export const POST: HTTP_POST = ($) => {
  return $.response[200].random();
};
