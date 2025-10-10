import type { HTTP_POST } from "../../../../types/paths/api/ai-agents-teams/run/send.types.js";

export const POST: HTTP_POST = ($) => {
  return $.response[200].random();
};
