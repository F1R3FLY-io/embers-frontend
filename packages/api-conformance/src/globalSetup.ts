import { banner, blockedReason, probeStack, readEnvironment } from "./gate";

/**
 * Decides whether the live campaign can run, BEFORE any test file is loaded.
 *
 * The decision has to be made here rather than inside the suites, because a
 * scenario that cannot run must SKIP, and Jest fixes that at definition time.
 * Deciding it in a `beforeAll` leaves only two options, both bad: return early
 * and report a pass for a scenario that exercised nothing, or fail and make an
 * absent stack look like a broken product.
 *
 * The verdict is passed to the workers through the environment, which Jest
 * forks after this runs.
 */
export default async function globalSetup(): Promise<void> {
  const environment = readEnvironment();

  const blocked = blockedReason(environment);
  if (blocked !== undefined) {
    process.env.EMBERS_ITEST_UNAVAILABLE = blocked;
    process.stdout.write(`\n${banner("Campaign not run", blocked)}\n\n`);
    return;
  }

  const probes = await probeStack(environment);
  const failed = probes.filter((probe) => !probe.ok);
  if (failed.length === 0) {
    delete process.env.EMBERS_ITEST_UNAVAILABLE;
    return;
  }

  const reason = failed
    .map((probe) =>
      [
        `${probe.name}: ${probe.detail ?? "failed"}`,
        ...(probe.remedy === undefined ? [] : [`  ${probe.remedy}`]),
      ].join("\n"),
    )
    .join("\n");

  process.env.EMBERS_ITEST_UNAVAILABLE = reason;
  process.stdout.write(`\n${banner("Stack unavailable", reason)}\n\n`);

  // Opt-in strictness, for a pipeline where a missing stack IS the failure.
  if (environment.requireStack) {
    throw new Error(`EMBERS_ITEST_REQUIRE_STACK is set and:\n${reason}`);
  }
}
