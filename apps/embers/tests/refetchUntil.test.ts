import { QueryClient } from "@tanstack/react-query";

import { refetchUntil } from "@/lib/queries";

// The read node trails the validator, so the first read after a write usually returns
// the list as it was: a *successful* response carrying stale data, which neither
// react-query's retry nor the backend's retry-on-empty helpers can see. Cached as
// current, it leaves a created record missing or a deleted one still present until
// something else happens to trigger a fetch.
//
// Creation was hardened against this once and deletion was not, so a deleted row
// could reappear on the next refetch. Both directions now go through this one loop,
// which is the point of the tests below: they exercise it in each direction, so the
// two cannot drift apart again.

const LIST_KEY = ["agents", "wallet-1"] as const;

/** A query whose backing data can be changed between reads, as a chain read is. */
function chainBacked(client: QueryClient, read: () => string[]) {
  client.setQueryDefaults(LIST_KEY, { queryFn: () => read() });
}

const client = () =>
  new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } },
  });

describe("refetchUntil", () => {
  it("stops as soon as the list already reflects the write", async () => {
    const qc = client();
    let reads = 0;
    chainBacked(qc, () => {
      reads += 1;
      return [];
    });
    await qc.fetchQuery({ queryKey: LIST_KEY });

    await refetchUntil(qc, LIST_KEY, () => true);

    // One refetch, then done: a settled list must not be polled twelve times.
    expect(reads).toBe(2);
  });

  it("keeps refetching until a deleted record stops coming back", async () => {
    // The delete direction, which was missing entirely. The observer answers with the
    // record still present for the first two reads.
    const qc = client();
    let reads = 0;
    chainBacked(qc, () => {
      reads += 1;
      return reads <= 2 ? ["doomed"] : [];
    });
    await qc.fetchQuery({ queryKey: LIST_KEY });

    await refetchUntil(
      qc,
      LIST_KEY,
      () => !(qc.getQueryData<string[]>(LIST_KEY) ?? []).includes("doomed"),
    );

    expect(qc.getQueryData<string[]>(LIST_KEY)).toEqual([]);
  });

  it("keeps refetching until a created record shows up", async () => {
    // The create direction, expressed through the same loop.
    const qc = client();
    let reads = 0;
    chainBacked(qc, () => {
      reads += 1;
      return reads <= 2 ? [] : ["fresh"];
    });
    await qc.fetchQuery({ queryKey: LIST_KEY });

    await refetchUntil(qc, LIST_KEY, () =>
      (qc.getQueryData<string[]>(LIST_KEY) ?? []).includes("fresh"),
    );

    expect(qc.getQueryData<string[]>(LIST_KEY)).toEqual(["fresh"]);
  });

  it("refetches a list nobody is currently observing", async () => {
    // `type: "all"`. Writes come from an editor page, so the dashboard's list is
    // usually inactive; invalidating alone would only mark it stale and refetch on
    // the next mount -- straight back into the same lag it is meant to escape.
    const qc = client();
    let reads = 0;
    chainBacked(qc, () => {
      reads += 1;
      return [`read-${reads}`];
    });
    await qc.fetchQuery({ queryKey: LIST_KEY });
    expect(qc.getQueryCache().find({ queryKey: LIST_KEY })?.isActive()).toBe(
      false,
    );

    await refetchUntil(qc, LIST_KEY, () => true);

    expect(qc.getQueryData<string[]>(LIST_KEY)).toEqual(["read-2"]);
  });

  it("leaves other lists alone", async () => {
    // `exact: true`. The agents and teams lists share a key prefix, so a prefix match
    // would refetch every team list on every agent write.
    const qc = client();
    let others = 0;
    chainBacked(qc, () => []);
    qc.setQueryDefaults(["agents", "wallet-1", "some-agent"], {
      queryFn: () => {
        others += 1;
        return [];
      },
    });
    await qc.fetchQuery({ queryKey: LIST_KEY });
    await qc.fetchQuery({ queryKey: ["agents", "wallet-1", "some-agent"] });

    await refetchUntil(qc, LIST_KEY, () => true);

    expect(others).toBe(1);
  });

  it("gives up rather than polling for ever", async () => {
    // A record that never settles -- a write that was rejected, or a node that stays
    // behind -- must not leave the app spinning. Twelve attempts is the bound; the
    // cache is left showing whatever the node last returned, which is the behaviour
    // that existed before any of this.
    jest.useFakeTimers();
    try {
      const qc = client();
      let reads = 0;
      chainBacked(qc, () => {
        reads += 1;
        return ["stuck"];
      });
      await qc.fetchQuery({ queryKey: LIST_KEY });

      const settled = refetchUntil(qc, LIST_KEY, () => false);
      // Well past the capped backoff summed over every attempt.
      await jest.advanceTimersByTimeAsync(120_000);
      await settled;

      expect(reads).toBe(13); // the initial fetch plus twelve attempts
    } finally {
      jest.useRealTimers();
    }
  });
});
