/**
 * Represents an amount of assets in the F1R3Cap system.
 */
export class Amount {
  private constructor(private value: bigint) {}

  public static tryFrom(value: bigint): Amount {
    if (value <= 0) {
      throw new Error("Amount cannot be negative or zero");
    }
    return new Amount(value);
  }

  public getValue(): bigint {
    return this.value;
  }
}
