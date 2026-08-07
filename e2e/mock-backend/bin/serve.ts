import { startMockBackend } from "../server";

/**
 * Runs the mock backend on its own, for driving the app by hand.
 *
 * The tests each start their own instance in-process; this is the same server
 * for the case where a person wants to click through a journey without a real
 * node. It seeds a small amount of data because an empty dashboard makes a
 * poor starting point, and prints the address to point `window.API_URL` at.
 *
 *   pnpm --filter @f1r3fly-io/embers-e2e mock:serve
 *
 * Then serve the app with `config.js` rewritten to that address, or set it
 * from the browser console before the bundle loads.
 */
const backend = await startMockBackend();

const researcher = backend.store.addAgent({
  code: 'new return in { return!("a summary") }',
  name: "Researcher",
});
backend.store.addAgent({
  code: 'new return in { return!("an archive entry") }',
  name: "Archivist",
});
backend.store.addTeam({
  agentIds: [researcher.id],
  name: "Research Desk",
});

process.stdout.write(
  [
    `mock backend listening on ${backend.url}`,
    "",
    `  window.API_URL = ${JSON.stringify(backend.url)}`,
    "",
    "seeded: 2 agents (Researcher, Archivist), 1 team (Research Desk)",
    "press ctrl-c to stop",
    "",
  ].join("\n"),
);

const stop = () => {
  void backend.close().then(() => process.exit(0));
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
