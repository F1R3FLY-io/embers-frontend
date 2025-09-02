import type { Name_Unit } from "./Name_Unit.js";
import type { Name_NVVar } from "./Name_NVVar.js";
import type { Name_NGVar } from "./Name_NGVar.js";
import type { Name_NQuoteGraph } from "./Name_NQuoteGraph.js";
import type { Name_NQuoteVertex } from "./Name_NQuoteVertex.js";

export type Name =
  | Name_Unit
  | Name_NVVar
  | Name_NGVar
  | Name_NQuoteGraph
  | Name_NQuoteVertex;
