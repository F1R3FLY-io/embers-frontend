
/**
 * Represents an amount of assets in the F1R3Cap system.
 */
export class Amount {
    private constructor(private value: number) { }

    public static tryFrom(value: number): Amount {
        if (value <= 0) {
            throw new Error("Amount cannot be negative or zero.");
        }
        return new Amount(value);
    }

    public getValue(): number {
        return this.value;
    }
}