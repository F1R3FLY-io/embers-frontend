import type { HTTP_POST } from "../../../../../types/paths/api/ai-agents/test/deploy/prepare.types.js";

export const POST: HTTP_POST = ($) => {
  return $.response[200].json({
    env_contract: Buffer.from("Hello, world!").toString("base64"),
    test_contract: Buffer.from("Hello, world!").toString("base64"),
  });
};
