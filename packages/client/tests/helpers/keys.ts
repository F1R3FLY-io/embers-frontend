/**
 * One fixed keypair, and the values the library derives from it.
 *
 * Signature and address tests need a key that does not change between runs:
 * `PrivateKey.new()` would make every recorded signature and every derived
 * address different, so nothing could be asserted about them except that they
 * parse. With a fixed key, a test can check that the deploy id equals the hex
 * of the signature over a known contract, and a changed derivation shows up as
 * a changed constant rather than as silence.
 *
 * WHAT THESE CONSTANTS DO AND DO NOT ESTABLISH. They were produced by this
 * library from TEST_PRIVATE_KEY_HEX, so they pin the derivation against
 * REGRESSION -- if a dependency bump or a refactor changes how a public key or
 * an address is computed, the suites using them fail. They are not independent
 * certification that the derivation is correct: proving that requires vectors
 * from another implementation, which belongs in the entity suites where the
 * algorithm itself is under test, not in a fixture module.
 *
 * TEST_PRIVATE_KEY_HEX is a throwaway value written here on purpose. It holds
 * no funds, exists only in this repository, and must never be used for anything
 * outside tests.
 */
export const TEST_PRIVATE_KEY_HEX =
  "0b4e1234567890abcdef0b4e1234567890abcdef0b4e1234567890abcdef0b4e";

/** `PrivateKey.toHex()` upper-cases, so a round trip is not string-identical. */
export const TEST_PRIVATE_KEY_HEX_CANONICAL =
  "0B4E1234567890ABCDEF0B4E1234567890ABCDEF0B4E1234567890ABCDEF0B4E";

/** Uncompressed secp256k1 point (65 bytes, leading 0x04). */
export const TEST_PUBLIC_KEY_HEX =
  "04EE44E2A733A8317EDC894439A687A0A0694C87033D97C183AF4E3077AE8851866342364F980A100F48264E0D8797DBEE86F000198C2D2E2DDD02768C403B8BCE";

/** keccak256 of the point body, blake2b-256, base58 with a 4-byte checksum. */
export const TEST_ADDRESS =
  "1111CHQEVaYoTj7jNkF9oZX9g3DqJJjyAU7qVbQB5HWuRyXE1Lnru";

/** A second key, for the "signed by the wrong wallet" negatives. */
export const OTHER_PRIVATE_KEY_HEX =
  "1c5f00000000000000000000000000000000000000000000000000000000abcd";

export const OTHER_ADDRESS =
  "11112YjarHCYxHQVt8khAFggWJXDEPUgkFLb6RHV3oxi1xerxE4X3z";
