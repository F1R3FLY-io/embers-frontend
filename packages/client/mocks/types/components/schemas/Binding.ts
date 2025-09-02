import type { Graph } from "./Graph.js";
import type { Vertex } from "./Vertex.js";

export type Binding = { graph: Graph; var: string; vertex: Vertex };
