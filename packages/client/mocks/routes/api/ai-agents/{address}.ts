import type { HTTP_GET } from "../../../types/paths/api/ai-agents/{address}.types.js";

export const GET: HTTP_GET = ($) => {
  if ($.headers["x-test-response"] === "all-props") {
    return $.response[200].json({
      agents: [
        {
          id: "fake id",
          name: "fake name",
          version: "fake version",
          shard: "fake shard",
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
        },
      ],
    });
  }
};
