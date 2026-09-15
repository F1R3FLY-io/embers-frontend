import { secp256k1 } from "@noble/curves/secp256k1.js";
import { base16, base64 } from "@scure/base";
import { blake2b } from "blakejs";
import { z } from "zod";

/**
 * What a signed send envelope must look like on the wire, and whether its
 * signature is real.
 *
 * These are the assertions that make a service test meaningful. A service can
 * appear to work -- both calls issued, a promise resolved -- while signing the
 * wrong bytes, echoing the wrong prepare, or subscribing to a finalization id
 * that will never arrive. None of that is visible without decoding what was
 * actually sent, so these helpers decode it.
 *
 * The signature check is the sharpest of them: it recomputes the digest the
 * SDK claims to have signed and verifies it against the deployer key in the
 * same payload, using the same curve the backend uses. A regression in the
 * hashing, the encoding, or the key derivation fails here rather than on a
 * developer's chain hours later.
 */

/**
 * A `SignedContract` as it appears ON THE WIRE.
 *
 * Snake_case, because the generated client renames on serialization: what the
 * TypeScript surface calls `sigAlgorithm` is sent as `sig_algorithm`. These
 * schemas describe the bytes the server receives, not the object the SDK
 * handed to the client, which is the whole point of asserting at this level --
 * a renaming bug between the two would be invisible from either side alone.
 */
export const signedContractSchema = z.object({
  contract: z.string(),
  deployer: z.string(),
  sig: z.string(),
  sig_algorithm: z.string(),
});

/** The two-phase send envelope: the echoed exchange plus the signed contract. */
export const sendEnvelopeSchema = z.object({
  prepare_request: z.unknown(),
  prepare_response: z.unknown(),
  request: z.unknown(),
  token: z.string(),
});

export type SignedContractWire = z.infer<typeof signedContractSchema>;

/** Parses and validates a send envelope, failing loudly on any shape drift. */
export function parseSendEnvelope(body: unknown) {
  return sendEnvelopeSchema.parse(body);
}

/**
 * Verifies a wire signature against the bytes it claims to cover.
 *
 * Mirrors what the backend does: blake2b-256 over the contract bytes, then
 * secp256k1 verification in DER form against the deployer's public key. The
 * digest is passed already hashed, which is why `prehash` is off.
 */
export function verifyWireSignature(signed: SignedContractWire): boolean {
  const contract = base64.decode(signed.contract);
  const digest = blake2b(contract, undefined, 32);

  return secp256k1.verify(
    base64.decode(signed.sig),
    digest,
    base64.decode(signed.deployer),
    { format: "der", prehash: false },
  );
}

/**
 * The deploy id the SDK should have subscribed to for a given signature.
 *
 * Lowercase base16 of the signature bytes. If this ever diverges from what
 * `subscribeForDeploy` was called with, every finalization wait in the SDK
 * silently runs to timeout instead of resolving -- a failure that looks like a
 * slow chain rather than a client bug, which is why it is asserted directly.
 */
export function expectedDeployId(signed: SignedContractWire): string {
  return base16.encode(base64.decode(signed.sig)).toLowerCase();
}

/** Base64 for a prepare response's `contract` field, given raw bytes. */
export function contractBytes(...bytes: number[]): string {
  return base64.encode(Uint8Array.from(bytes));
}
