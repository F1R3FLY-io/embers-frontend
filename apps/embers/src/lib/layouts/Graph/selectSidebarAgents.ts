/** Chooses and orders the agents the graph sidebar offers as draggable nodes.
 *
 * Extracted from the component so the "every agent is offered" invariant can be
 * asserted directly. The sidebar once appeared to show only six agents; the cause
 * was a CSS height cap, not this selection, but a `slice` creeping in here would
 * look identical to the user, and only this half is unit-testable -- jsdom has no
 * layout engine, so no test can observe clipping.
 *
 * Generic over the element type: the caller keeps its concrete agent type, and
 * this module stays free of React and SDK imports so a plain node-environment
 * test can import it.
 */
export function selectSidebarAgents<T extends { name: string }>(
  agents: readonly T[],
  searchQuery: string,
): T[] {
  const query = searchQuery.trim().toLowerCase();

  return agents
    .filter((agent) => agent.name.toLowerCase().includes(query))
    .sort((left, right) =>
      // Case-insensitive so `cavify` and `Cavify` order the same way, matching
      // how the dashboard sorts.
      left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
    );
}
