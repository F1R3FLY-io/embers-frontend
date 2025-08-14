import type { EnvDeployFailed } from "./EnvDeployFailed.js";

export type DeploySignedTestResp_EnvDeployFailed = {
  type: "EnvDeployFailed";
} & EnvDeployFailed;
