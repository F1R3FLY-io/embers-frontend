import { randomBytes } from "node:crypto";

import type { PublicKey } from "../../packages/client/src/entities/PublicKey";

import { Uri } from "../../packages/client/src/entities/Uri";

/**
 * Registry URIs the client will accept.
 *
 * A deployed team carries a `rho:id:...` URI, and the client parses it on the
 * way in: z-base-32 over a blake2b key hash with a CRC-14 checksum. A made-up
 * string is rejected before any assertion in a test can run, and rejected in a
 * way that reads as an application fault rather than a bad fixture.
 *
 * Encoded through the SDK's own entity rather than pinned as a constant, so a
 * change to the encoding cannot leave this quietly wrong. Only `Uri` is
 * imported: the package barrel pulls in the WebAssembly graph parser, and the
 * key entities reach a CommonJS hash library that Node's ESM loader will not
 * give named exports for.
 *
 * The bytes hashed are random rather than a real curve point, which is
 * indistinguishable to every consumer -- `Uri` hashes what it is handed and
 * the checksum is over that hash, so nothing downstream can tell, and nothing
 * downstream is being tested on whether it can.
 */
export function newTeamUri(): string {
  const arbitraryKey = {
    value: new Uint8Array(randomBytes(65)),
  } as PublicKey;

  return Uri.fromPublicKey(arbitraryKey).toString();
}
