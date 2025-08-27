import type { HTTP_GET } from "../../../../../../types/paths/api/ai-agents-teams/{address}/{id}/versions/{version}.types.js";

export const GET: HTTP_GET = ($) => {
  return $.response[200].random();
};
