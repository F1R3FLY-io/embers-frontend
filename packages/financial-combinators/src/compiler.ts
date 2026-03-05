/**
 * @file compiler.ts
 *
 * Walks an Embers dataflow graph in topological order and calls each node's
 * `toRholang` to produce a single deployable rholang program.
 *
 * ─ Graph model ────────────────────────────────────────────────────────
 *
 *   CanvasGraph {
 *     nodes: { [nodeInstanceId: string]: CanvasNode }
 *     edges: CanvasEdge[]
 *   }
 *
 *   CanvasNode {
 *     instanceId: string       // unique within this graph
 *     definitionId: string     // key into SPJ_NODE_REGISTRY (or core registry)
 *     params: Record<string, unknown>
 *   }
 *
 *   CanvasEdge {
 *     fromNodeId: string; fromPortId: string   // output port
 *     toNodeId:   string; toPortId:   string   // input port
 *   }
 *
 * ─ Algorithm ──────────────────────────────────────────────────────────
 *
 *   1. Build adjacency list from edges.
 *   2. Topological sort (Kahn's algorithm).
 *   3. Walk sorted nodes; for each node call toRholang with already-compiled
 *      children substituted as inputCode[portId].
 *   4. The root node(s) – nodes with no outgoing "contract" edges – form the
 *      top-level deployment expression.
 */

import { SPJ_NODE_REGISTRY } from "@f1r3fly-io/financial-combinators";
import type { NodeDefinition } from "@f1r3fly-io/financial-combinators";

// ──────────────────────────────────────────────────────
// Graph types (mirror the embers-frontend canvas model)
// ──────────────────────────────────────────────────────

export interface CanvasNode {
  instanceId: string;
  definitionId: string;
  params: Record<string, unknown>;
}

export interface CanvasEdge {
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
}

export interface CanvasGraph {
  nodes: Record<string, CanvasNode>;
  edges: CanvasEdge[];
}

export interface CompileResult {
  ok: true;
  rholang: string;
  roots: string[];   // instanceIds of root nodes
}

export interface CompileError {
  ok: false;
  error: string;
}

// ──────────────────────────────────────────────────────
// Registry (merge core + SPJ)
// ──────────────────────────────────────────────────────

type Registry = Record<string, NodeDefinition>;

/** Build the full registry.  Pass additional registries (core Embers nodes) to merge. */
export function buildRegistry(...extras: Registry[]): Registry {
  return Object.assign({}, SPJ_NODE_REGISTRY, ...extras);
}

// ──────────────────────────────────────────────────────
// Topological sort (Kahn)
// ──────────────────────────────────────────────────────

function topoSort(graph: CanvasGraph): string[] | null {
  const ids = Object.keys(graph.nodes);
  const inDeg: Record<string, number> = {};
  const adj: Record<string, string[]> = {};   // fromNodeId → [toNodeId]

  for (const id of ids) {
    inDeg[id] = 0;
    adj[id] = [];
  }

  for (const edge of graph.edges) {
    adj[edge.fromNodeId].push(edge.toNodeId);
    inDeg[edge.toNodeId] = (inDeg[edge.toNodeId] ?? 0) + 1;
  }

  const queue = ids.filter(id => inDeg[id] === 0);
  const sorted: string[] = [];

  while (queue.length > 0) {
    const node = queue.shift()!;
    sorted.push(node);
    for (const neighbour of adj[node]) {
      inDeg[neighbour]--;
      if (inDeg[neighbour] === 0) queue.push(neighbour);
    }
  }

  if (sorted.length !== ids.length) return null; // cycle detected
  return sorted;
}

// ──────────────────────────────────────────────────────
// Compiler
// ──────────────────────────────────────────────────────

export function compileGraph(
  graph: CanvasGraph,
  registry: Registry = SPJ_NODE_REGISTRY,
): CompileResult | CompileError {

  // 1. Topological sort
  const order = topoSort(graph);
  if (!order) {
    return { ok: false, error: "Cycle detected in dataflow graph" };
  }

  // 2. Build edge lookup: toNodeId+portId → (fromNodeId, fromPortId)
  type EdgeKey = string;
  const edgeMap = new Map<EdgeKey, { fromNodeId: string; fromPortId: string }>();
  for (const edge of graph.edges) {
    const key: EdgeKey = `${edge.toNodeId}::${edge.toPortId}`;
    edgeMap.set(key, { fromNodeId: edge.fromNodeId, fromPortId: edge.fromPortId });
  }

  // 3. Walk in topo order, accumulating rholang per instance
  const compiled: Record<string, string> = {};

  for (const instanceId of order) {
    const canvasNode = graph.nodes[instanceId];
    if (!canvasNode) continue;

    const def = registry[canvasNode.definitionId];
    if (!def) {
      return {
        ok: false,
        error: `Unknown node definition: "${canvasNode.definitionId}" (instance ${instanceId})`,
      };
    }

    // Resolve input ports
    const inputCode: Record<string, string> = {};
    for (const port of def.inputs) {
      const key: EdgeKey = `${instanceId}::${port.id}`;
      const upstream = edgeMap.get(key);
      if (upstream) {
        inputCode[port.id] = compiled[upstream.fromNodeId] ?? "";
      } else if (!port.optional) {
        // Unconnected required port – fall back to zero contract
        inputCode[port.id] = "";
      }
    }

    compiled[instanceId] = def.toRholang(canvasNode.params, inputCode);
  }

  // 4. Find root nodes (no outgoing contract edges consumed by a parent)
  const consumed = new Set(graph.edges.map(e => e.fromNodeId));
  const roots = order.filter(id => {
    const def = registry[graph.nodes[id]?.definitionId ?? ""];
    // a root is a node whose output is not consumed by anything
    return def && !consumed.has(id);
  });

  if (roots.length === 0) {
    return { ok: false, error: "No root node found – graph has no terminal output." };
  }

  // 5. Assemble final program
  // For a single-root graph we return its rholang directly.
  // For multi-root we wrap in parallel composition.
  const rootExprs = roots.map(id => compiled[id]).filter(Boolean);
  const program =
    rootExprs.length === 1
      ? rootExprs[0]
      : rootExprs.join("\n|\n");

  const header = `// Generated by Embers Financial Contracts Compiler
// F1R3FLY shard-native rholang deployment
// Roots: [${roots.join(", ")}]
//
// Deploy via: POST /api/v1/deploy  { term: <this string>, phloLimit: 500000 }
//
`;

  return {
    ok: true,
    rholang: header + program,
    roots,
  };
}
