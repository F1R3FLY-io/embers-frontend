import createKeccakHash from "keccak";
import secp256k1 from "secp256k1";

export class PublicKey {
  private constructor(private value: Uint8Array) {}

  public static tryFrom(value: Uint8Array) {
    secp256k1.publicKeyVerify(value);
    return new PublicKey(value);
  }

  public getValue(): Uint8Array {
    return this.value;
  }

  public getHash(): string {
    const value = this.value.slice(1, -40);
    const newLocal = createKeccakHash("keccak256")
      .update(Buffer.from(value))
      .digest("hex");
    return newLocal.toUpperCase();
  }
}
