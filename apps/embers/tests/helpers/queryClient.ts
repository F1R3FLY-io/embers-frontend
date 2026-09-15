import { QueryClient } from "@tanstack/react-query";

/**
 * A QueryClient for one test.
 *
 * Retries are off because the app's real retry policy is generous -- `useAgent`
 * retries ten times with jittered backoff -- and a test that inherits it turns
 * an assertion about one failed request into a multi-second wait for eleven.
 * Suites that are specifically about retry behavior build their own client and
 * say so.
 *
 * Times are infinite so nothing refetches on a schedule mid-assertion: a test
 * should observe exactly the fetches it provoked. Cached data never goes stale
 * on its own, which makes "the list updated" a statement about the code under
 * test rather than about timing.
 *
 * Always per-test, never shared: a client carries cache state, and a shared one
 * makes suites pass or fail depending on the order they ran in.
 */
export function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { gcTime: Infinity, retry: false, staleTime: Infinity },
    },
  });
}
