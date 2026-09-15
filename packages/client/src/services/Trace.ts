export interface AgentTraceEntry {
  agentName: string;
  attempt?: number;
  context?: { iterations?: Record<string, number>; scopePath?: string[] };
  executionId: string;
  id: string;
  input?: unknown;
  inputAvailable: boolean;
  legacy?: boolean;
  nodeId: string;
  observedAt?: string;
  output?: unknown;
  outputAvailable: boolean;
  sequence: number;
  status: string;
  teamUri: string;
}
export interface TraceSession {
  accessToken: string;
  expiresAt: number;
}
export interface AgentTracePage {
  entries: AgentTraceEntry[];
  legacyNotice: string | null;
  nextOffset: number | null;
  revision: number;
  runId: string;
  status: string;
}
