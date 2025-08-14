import type { SignedTestDeployLogs } from "./SignedTestDeployLogs.js";

export type DeploySignedTestResp_SignedTestDeployLogs = {
  type: "Ok";
} & SignedTestDeployLogs;
