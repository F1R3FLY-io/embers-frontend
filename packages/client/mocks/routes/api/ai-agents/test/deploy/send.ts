import type { HTTP_POST } from "../../../../../types/paths/api/ai-agents/test/deploy/send.types.js";

export const POST: HTTP_POST = ($) => {
  if ($.headers["x-test-response"] === "with_logs") {
    return $.response[200].json({
      logs: [
        {
          level: "info",
          message: "Hello, World!",
        },
      ],
    });
  } else {
    return $.response[200].json({
      error: "test failed",
    });
  }
};
