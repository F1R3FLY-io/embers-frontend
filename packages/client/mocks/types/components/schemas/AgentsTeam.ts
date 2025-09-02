import type { Graph } from "./Graph.js";

export type AgentsTeam = {
  id: string;
  version: string;
  name: string;
  shard?: string;
  graph?: string;
  graph_ast?: Graph;
};
