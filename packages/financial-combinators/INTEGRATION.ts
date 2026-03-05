/**
 * INTEGRATION NOTE
 * ────────────────
 * This file shows the change needed in:
 *   apps/embers/src/lib/components/GraphEditor/nodes/nodes.registry.tsx
 *
 * Add the import and spread the SPJ_NODE_REGISTRY into the existing registry
 * export. The exact shape of that file depends on how it currently exports its
 * node map – adjust accordingly.
 *
 * STEP 1 – Add workspace dependency to apps/embers/package.json:
 *
 *   "dependencies": {
 *     "@f1r3fly-io/financial-combinators": "workspace:*",
 *     ...existing deps
 *   }
 *
 * STEP 2 – In nodes.registry.tsx, add:
 */

import { SPJ_NODE_REGISTRY } from "@f1r3fly-io/financial-combinators";

// Merge into whatever the existing registry export looks like, e.g.:
//
//   export const NODE_REGISTRY = {
//     ...EXISTING_NODES,
//     ...SPJ_NODE_REGISTRY,
//   };
//
// The SPJ_NODE_REGISTRY keys are all namespaced ("spj.*", "instrument.*",
// "spj.obs.*") so there is no risk of collision with existing node IDs.

export { SPJ_NODE_REGISTRY };
