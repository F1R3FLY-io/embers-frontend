// Basic API types for embers-client-sdk
// These are placeholder types until auto-generated declarations work properly

export interface Agent {
  id?: string;
  name?: string;
  description?: string;
}

export interface AgentHeader {
  id?: string;
  name?: string;
}

export interface DeployAgentResp {
  success?: boolean;
  message?: string;
}

export interface WalletStateAndHistory {
  balance?: string;
  transactions?: any[];
}

export interface TransferReq {
  from: string;
  to: string;
  amount: bigint;
  description?: string;
}

export interface TransferResp {
  success?: boolean;
  txId?: string;
}

export interface CreateAgentReq {
  name?: string;
  description?: string;
  code?: string;
}

export interface CreateAgentsTeamReq {
  name?: string;
  description?: string;
  agents?: Agent[];
}

// Add more types as needed
export type Base64 = string;
