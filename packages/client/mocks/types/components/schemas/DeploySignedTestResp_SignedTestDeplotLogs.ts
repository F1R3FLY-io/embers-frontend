import type { SignedTestDeplotLogs } from "./SignedTestDeplotLogs.js";

export type DeploySignedTestResp_SignedTestDeplotLogs = {
  type: "Ok";
} & SignedTestDeplotLogs;
