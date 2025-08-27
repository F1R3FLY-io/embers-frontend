import type { HTTP_GET } from "../../../types/paths/api/ai-agents/{address}.types.js";

export const GET: HTTP_GET = ($) => {
  if ($.x.headers["x-test-response"] === "all-props") {
    return $.response[200].json({
      agents: [
        {
          id: "fake id",
          name: "fake name",
          shard: "fake shard",
          version: "fake version",
        },
      ],
    });
  }
  return $.response[200].json({
    agents: [
      {
        id: "fake id",
        name: "fake name",
        version: "fake version",
      },
    ],
  });
};
