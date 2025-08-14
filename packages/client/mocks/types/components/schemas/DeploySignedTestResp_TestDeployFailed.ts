import type { TestDeployFailed } from "./TestDeployFailed.js";

export type DeploySignedTestResp_TestDeployFailed = {
  type: "TestDeployFailed";
} & TestDeployFailed;
