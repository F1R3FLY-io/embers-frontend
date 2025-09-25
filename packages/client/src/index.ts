import init from "@f1r3fly-io/graphl-parser";

void init();

export * from "./api-client";
export * from "./entities/Address";
export * from "./entities/AgentsApi";
export * from "./entities/AgentsTeamsApi";
export * from "./entities/Amount";
export * from "./entities/Description";
export * from "./entities/PrivateKey";
export * from "./entities/PublicKey";
export * from "./entities/TestnetApi";
export * from "./entities/WalletsApi";
export * from "./serialization";

export type {
  Binding,
  Error,
  GContext,
  GEdgeAnon,
  GEdgeNamed,
  Graph,
  GraphBinding,
  GRuleAnon,
  GRuleNamed,
  GTensor,
  GVar,
  GVertex,
  Name,
  Vertex,
} from "@f1r3fly-io/graphl-parser";
