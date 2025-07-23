import z from "zod";

export const AgentHeader = z.object({
  id: z.string(),
  name: z.string(),
  shard: z.string().optional(),
  version: z.string(),
});
export type AgentsHeader = z.infer<typeof AgentHeader>;

export const Agents = z.object({
  agents: z.array(AgentHeader),
});
export type Agents = z.infer<typeof Agents>;

export const Agent = z.object({
  code: z.string().optional(),
  id: z.string(),
  name: z.string(),
  shard: z.string().optional(),
  version: z.string(),
});
export type Agent = z.infer<typeof Agent>;

const byte = z.number().int().min(0).max(255);
const byteArray = z.array(byte).transform((array) => new Uint8Array(array));

export type CreateAgentReq = {
  code?: string;
  name: string;
  shard?: string;
};

export const CreateAgentResp = z.object({
  contract: byteArray,
  id: z.string(),
  version: z.string(),
});
export type CreateAgentResp = z.infer<typeof CreateAgentResp>;

export const SaveAgentResp = z.object({
  contract: byteArray,
  version: z.string(),
});
export type SaveAgentResp = z.infer<typeof SaveAgentResp>;

export const CreateTestwalletResp = z.object({
  key: z.string(),
});
export type CreateTestwalletResp = z.infer<typeof CreateTestwalletResp>;

export type DeployTestReq = {
  env?: string;
  test: string;
};

export const DeployTestResp = z.object({
  env_contract: byteArray.optional(),
  test_contract: byteArray,
});
export type DeployTestResp = z.infer<typeof DeployTestResp>;

export const DeploySignedTestResp = z.object({});
export type DeploySignedTestResp = z.infer<typeof DeploySignedTestResp>;

export type DeployReq = {
  id: string;
  version: string;
};

export const DeploResp = z.object({
  contract: byteArray,
});
export type DeploResp = z.infer<typeof DeploResp>;
