import { defineConfig, globalIgnores } from "eslint/config";

import baseConfig from "../../eslint.config.js";

/**
 * Removing a node by hand-building `{ type: "remove" }` changes and passing them to
 * `onNodesChange` drops the node and leaves its edges behind, naming a vertex that
 * no longer exists. The saved graph is then rejected by the compiler — permanently,
 * because the editor cannot draw such an edge and so gives no sign it is there.
 * Only React Flow's own `deleteElements` removes a node's edges with it.
 *
 * See docs/post-mortems/AGENT_TEAM_EDITOR_GRAPH_CORRUPTION.md.
 *
 * Two selectors, because the mistake has two shapes and each was checked against
 * the code that actually caused it:
 *
 *   1. the changes passed inline —      onNodesChange(nodes.map(n => ({ type: "remove" })))
 *   2. the changes bound first —        const c: NodeChange<Node>[] = …; onNodesChange(c)
 *
 * The nested `:has(Literal[value='remove'])` is load-bearing. The obvious
 * `[value.value='remove']` does not match `"remove" as const`, whose value node is a
 * TSAsExpression — that is precisely how the original was written, so the simpler
 * selector would have matched nothing at all.
 *
 * Edge removal is deliberately not restricted: deleting an edge strands nothing.
 */
const NODE_REMOVAL_MESSAGE =
  "Use rf.deleteElements() — hand-built node removals strand the node's edges, " +
  "producing a graph the compiler rejects. See docs/post-mortems/AGENT_TEAM_EDITOR_GRAPH_CORRUPTION.md.";

export default defineConfig(
  baseConfig,
  globalIgnores(["**/*.module.d.scss.ts"]),
  {
    files: ["src/lib/components/GraphEditor/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          message: NODE_REMOVAL_MESSAGE,
          selector:
            "CallExpression[callee.name='onNodesChange']:has(Property[key.name='type']:has(Literal[value='remove']))",
        },
        {
          message: NODE_REMOVAL_MESSAGE,
          selector:
            "VariableDeclarator:has(TSTypeReference[typeName.name='NodeChange']):has(Property[key.name='type']:has(Literal[value='remove']))",
        },
      ],
    },
  },
);
