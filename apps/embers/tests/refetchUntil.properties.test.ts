import type { QueryClient } from "@tanstack/react-query";

import { refetchUntil } from "@/lib/queries";

import { fc } from "./helpers/fc";

// The reconciliation loop's laws, for every settling point rather than the few
// an example test names.
//
// This loop is what stands between a write and the user believing it happened.
// Two things must hold no matter when the chain catches up: it must stop (a
// loop that never terminates freezes the flow that awaits it), and it must not
// stop early (giving up before the record appears is what made a created agent
// invisible until a manual refresh -- commit ae78b40).

const MAX_ATTEMPTS = 12;
const FIRST_DELAY_MS = 500;
const MAX_DELAY_MS = 4000;

/** Runs the loop with a predicate that settles after a chosen refetch count. */
async function run(settleAfterRefetches: number) {
  let refetches = 0;
  const delays: number[] = [];

  const client = {
    refetchQueries: async () => {
      refetches += 1;
      return Promise.resolve();
    },
  } as unknown as QueryClient;

  const realSetTimeout = globalThis.setTimeout;
  const patched = ((handler: () => void, ms?: number) => {
    delays.push(ms ?? 0);
    // Run the continuation immediately: the delay's VALUE is what matters to
    // these laws, not the waiting.
    return realSetTimeout(handler, 0);
  }) as typeof globalThis.setTimeout;
  globalThis.setTimeout = patched;

  try {
    await refetchUntil(
      client,
      ["key"],
      () => refetches >= settleAfterRefetches,
    );
  } finally {
    globalThis.setTimeout = realSetTimeout;
  }

  return { delays, refetches };
}

it("always terminates, whenever the chain settles", async () => {
  await fc.assert(
    fc.asyncProperty(fc.integer({ max: 30, min: 1 }), async (settleAfter) => {
      const { refetches } = await run(settleAfter);
      // Including settling points beyond the attempt budget: the loop gives up
      // rather than looping forever, which is the documented behavior -- a
      // stale list is recoverable, a hung promise is not.
      expect(refetches).toBeLessThanOrEqual(MAX_ATTEMPTS);
    }),
  );
});

it("refetches exactly as many times as it needs, and no more", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ max: MAX_ATTEMPTS, min: 1 }),
      async (settleAfter) => {
        const { refetches } = await run(settleAfter);
        // Stopping the instant the record appears is what keeps the dashboard
        // from issuing eleven pointless reads against a chain that answered on
        // the first.
        expect(refetches).toBe(settleAfter);
      },
    ),
  );
});

it("waits between attempts, never spinning", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ max: MAX_ATTEMPTS, min: 2 }),
      async (settleAfter) => {
        const { delays } = await run(settleAfter);
        // One wait per gap between attempts. A missing wait would hammer the
        // node with a tight loop at exactly the moment it is already behind.
        expect(delays).toHaveLength(settleAfter - 1);
        for (const delay of delays) {
          expect(delay).toBeGreaterThan(0);
        }
      },
    ),
  );
});

it("backs off exponentially up to a ceiling", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ max: MAX_ATTEMPTS, min: 2 }),
      async (settleAfter) => {
        const { delays } = await run(settleAfter);

        expect(delays[0]).toBe(FIRST_DELAY_MS);
        for (let index = 1; index < delays.length; index += 1) {
          // Doubling, capped: unbounded doubling would push the last attempts
          // minutes apart and make a slow-but-healthy node look like a failure.
          expect(delays[index]).toBe(
            Math.min(delays[index - 1] * 2, MAX_DELAY_MS),
          );
        }
        expect(Math.max(...delays)).toBeLessThanOrEqual(MAX_DELAY_MS);
      },
    ),
  );
});

it("resolves rather than rejecting when it gives up", async () => {
  // A record that never appears leaves the list stale, which the next natural
  // refetch corrects. Rejecting instead would turn a slow chain into a visible
  // failure for an operation that actually succeeded.
  await expect(run(MAX_ATTEMPTS + 5)).resolves.toBeDefined();
});
