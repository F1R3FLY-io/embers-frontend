/**
 * Stands in for the graphl parser's WebAssembly module.
 *
 * `@f1r3fly-io/embers-client-sdk` runs `void init()` on the graphl parser at
 * import time, and the generated `Graph` model calls into that WASM to convert
 * between the canvas AST and the graphl string the API carries. Loading real
 * WebAssembly under jsdom means fetching a `.wasm` file with globals jsdom does
 * not provide, so importing the SDK at all used to fail -- which is why every
 * suite that needed it mocked the entire SDK and tested against a hand-built
 * imitation of its surface instead.
 *
 * Replacing just the parser is the smaller and more honest substitution: the
 * SDK's own code, protocol, and crypto stay real, and only the format
 * conversion is stubbed. The identity conversions below are sufficient because
 * app-level tests treat graphl as an opaque payload -- they assert that a team
 * round-trips, never what the serialization looks like. Anything that genuinely
 * depends on graphl semantics belongs in packages/client, whose node
 * environment loads the real WASM.
 */

/** The SDK's import-time `init()`; resolving is all that is required of it. */
// Awaits nothing -- the SDK only needs a thenable that settles -- but the
// signature it is substituting for returns a promise.
// eslint-disable-next-line @typescript-eslint/require-await
export default async function init(): Promise<undefined> {
  return undefined;
}

export function parseToAst(source: unknown): unknown {
  return source;
}

export function astToGraphl(ast: unknown): string {
  return typeof ast === "string" ? ast : JSON.stringify(ast);
}
