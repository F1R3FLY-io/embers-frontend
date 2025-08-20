import type { HTTP_POST } from "../../../../../types/paths/api/ai-agents/test/deploy/send.types.js";

export const POST: HTTP_POST = ($) => {
  if ($.x.headers["x-test-response"] === "with-logs") {
    return $.response[200].json({
      type: "Ok",
      logs: [
        {
          level: "info",
          message: "Hello, World!",
        },
      ],
    });
  } else {
    return $.response[200].json({
      type: "TestDeployFailed",
      error: "test failed",
    });
  }
};
