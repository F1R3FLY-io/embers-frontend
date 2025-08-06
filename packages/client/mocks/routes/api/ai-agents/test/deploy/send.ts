import type { HTTP_POST } from "../../../../../types/paths/api/ai-agents/test/deploy/send.types.js";

export const POST: HTTP_POST = ($) => {
    const mock = {
      error: "No error",
      logs: [
        {
          level: "info",
          message: "Hello, World!"
        }
      ]
  };

  return $.response[200].json(mock);
};
