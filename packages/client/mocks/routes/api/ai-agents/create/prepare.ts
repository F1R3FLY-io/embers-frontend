import type { HTTP_POST } from "../../../../types/paths/api/ai-agents/create/prepare.types.js";

export const POST: HTTP_POST = ($) => {
  return $.response[200].json({
    contract: Buffer.from("Hello, world!").toString("base64"),
    id: "fake id",
    version: "fake version",
  });
};
