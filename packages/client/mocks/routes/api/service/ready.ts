import type { HTTP_GET } from "../../../types/paths/api/service/ready.types.js";

export const GET: HTTP_GET = ($) => {
  return $.response[200];
};
