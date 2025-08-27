import type { Graph_Unit } from "./Graph_Unit.js";
import type { Graph_GVertex } from "./Graph_GVertex.js";
import type { Graph_GVar } from "./Graph_GVar.js";
import type { Graph_Binding } from "./Graph_Binding.js";
import type { Graph_GEdgeAnon } from "./Graph_GEdgeAnon.js";
import type { Graph_GEdgeNamed } from "./Graph_GEdgeNamed.js";
import type { Graph_GRuleAnon } from "./Graph_GRuleAnon.js";
import type { Graph_GRuleNamed } from "./Graph_GRuleNamed.js";
import type { Graph_GSubgraph } from "./Graph_GSubgraph.js";
import type { Graph_GTensor } from "./Graph_GTensor.js";

export type Graph =
  | Graph_Unit
  | Graph_GVertex
  | Graph_GVar
  | Graph_Binding
  | Graph_GEdgeAnon
  | Graph_GEdgeNamed
  | Graph_GRuleAnon
  | Graph_GRuleNamed
  | Graph_GSubgraph
  | Graph_GTensor;
