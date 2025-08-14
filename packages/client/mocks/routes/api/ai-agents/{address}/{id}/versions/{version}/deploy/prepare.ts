import type { HTTP_POST } from "../../../../../../../../types/paths/api/ai-agents/{address}/{id}/versions/{version}/deploy/prepare.types.js";

export const POST: HTTP_POST = ($) => {
  return $.response[200].json({
    contract: Buffer.from("Hello, World!").toString("base64"),
  });
};
