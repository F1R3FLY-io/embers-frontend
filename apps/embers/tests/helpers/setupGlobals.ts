import { TextDecoder, TextEncoder } from "node:util";

/**
 * Web globals that jsdom does not implement, supplied from Node's own
 * implementations.
 *
 * jsdom ships no `TextEncoder`/`TextDecoder`, but they are ordinary web
 * platform APIs that a browser always has, and libraries written for browsers
 * reasonably assume them. React Router 7 reads `TextEncoder` at import time, so
 * without this a `MemoryRouter` test fails while loading the router rather than
 * while testing anything -- which is why the suites here mocked the router
 * wholesale instead of routing through it.
 *
 * Node's implementations are the same WHATWG APIs, so this closes the gap
 * rather than approximating it. Each is installed only when absent, so a future
 * jsdom that provides them keeps its own.
 *
 * Runs under `setupFiles`, before the test module and its imports are
 * evaluated; anything installed later would arrive after the import that needs
 * it. Node-environment suites already have these globals and are unaffected.
 */
const webGlobals: Record<string, unknown> = {
  TextDecoder,
  TextEncoder,
};

for (const [name, implementation] of Object.entries(webGlobals)) {
  if (!(name in globalThis)) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value: implementation,
      writable: true,
    });
  }
}
