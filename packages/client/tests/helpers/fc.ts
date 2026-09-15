import fc from "fast-check";

/**
 * Shared fast-check configuration.
 *
 * Property tests state a law and let the library hunt for a counterexample, so
 * the run count is a budget for how hard it hunts. CI can afford more cases
 * than an edit-run-edit loop, so the two differ, and both are overridable when
 * investigating a specific property.
 *
 * Seeds are deliberately NOT pinned. A fixed seed makes every run examine the
 * same inputs, which turns a property test into a slower example test; leaving
 * it random means coverage accumulates across runs. Reproducibility is not lost
 * -- on failure fast-check prints the seed and path, and the counterexample is
 * shrunk to its minimal form:
 *
 *   FC_SEED=<printed seed> pnpm --filter @f1r3fly-io/embers-client-sdk test -- -t "<name>"
 *
 * Import this module for its side effect before writing properties; every
 * property suite in this workspace does so from its first line.
 */
fc.configureGlobal({
  numRuns: Number(
    process.env.FC_NUM_RUNS ?? (process.env.CI !== undefined ? 250 : 100),
  ),
  ...(process.env.FC_SEED === undefined
    ? {}
    : { seed: Number(process.env.FC_SEED) }),
  verbose: 1,
});

export { fc };
