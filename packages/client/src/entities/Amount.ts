export const MAX_AMOUNT = 9_223_372_036_854_775_807n;

/**
 * Represents an amount of assets in the F1R3Cap system.
 */
export class Amount {
  private constructor(public readonly value: bigint) {}

  public static tryFrom(value: bigint): Amount {
    if (value <= 0n || value > MAX_AMOUNT) {
      throw new Error("Amount cannot be negative or zero");
    }
    return new Amount(value);
  }

  public toString() {
    return this.value.toString();
  }
}
