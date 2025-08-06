import type { HTTP_GET } from "../../../../../types/paths/api/ai-agents/{address}/{id}/{version}.types.js";

export const GET: HTTP_GET = ($) => {
  return $.response[200].json({
    "code": 123,
    "id": "officia",
    "name": "incididunt nostrud",
    "shard": "test shard",
    "version": "ullamco",

  });
};
