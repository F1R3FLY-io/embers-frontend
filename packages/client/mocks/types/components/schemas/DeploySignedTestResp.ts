import type { DeploySignedTestResp_EnvDeployFailed } from "./DeploySignedTestResp_EnvDeployFailed.js";
import type { DeploySignedTestResp_TestDeployFailed } from "./DeploySignedTestResp_TestDeployFailed.js";
import type { DeploySignedTestResp_SignedTestDeployLogs } from "./DeploySignedTestResp_SignedTestDeployLogs.js";

export type DeploySignedTestResp =
  | DeploySignedTestResp_EnvDeployFailed
  | DeploySignedTestResp_TestDeployFailed
  | DeploySignedTestResp_SignedTestDeployLogs;
