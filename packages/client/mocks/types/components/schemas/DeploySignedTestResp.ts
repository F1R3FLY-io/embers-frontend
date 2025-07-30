import type { SignedTestDeplotError } from "./SignedTestDeplotError.js";
import type { SignedTestDeplotLogs } from "./SignedTestDeplotLogs.js";

export type DeploySignedTestResp =
  | SignedTestDeplotError
  | SignedTestDeplotError
  | SignedTestDeplotLogs;
