// Basic API types for embers-client-sdk
// These are placeholder types until auto-generated declarations work properly

export interface Agent {
  description?: string;
  id?: string;
  name?: string;
}

export interface AgentHeader {
  id?: string;
  name?: string;
}

export interface DeployAgentResp {
  message?: string;
  success?: boolean;
}

export interface WalletStateAndHistory {
  balance?: string;
  transactions?: unknown[];
}

export interface TransferReq {
  amount: bigint;
  description?: string;
  from: string;
  to: string;
}

export interface TransferResp {
  success?: boolean;
  txId?: string;
}

export interface CreateAgentReq {
  code?: string;
  description?: string;
  name?: string;
}

export interface CreateAgentsTeamReq {
  agents?: Agent[];
  description?: string;
  name?: string;
}

// Add more types as needed
export type Base64 = string;
