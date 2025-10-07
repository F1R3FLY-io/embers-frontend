import type { HTTP_GET } from "../../../../../types/paths/api/ai-agents/{address}/{id}/versions.types.js";

export const GET: HTTP_GET = ($) => {
  if ($.x.headers["x-test-response"] === "all-props") {
    return $.response[200].json({
      agents: [
        {
          id: "fake id",
          name: "fake name",
          version: "fake version",
          shard: "fake shard",
          created_at: "1234",
        },
      ],
    });
  } else {
    return $.response[200].json({
      agents: [
        {
          id: "fake id",
          name: "fake name",
          version: "fake version",
          created_at: "1234",
        },
      ],
    });
  }
};
