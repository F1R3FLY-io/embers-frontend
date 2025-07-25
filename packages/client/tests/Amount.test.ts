import { Amount } from "../src/entities/Amount";

describe("Amount class", () => {
  test("should create an Amount", () => {
    const amount = Amount.tryFrom(100n);

    expect(amount).toBeDefined();
    expect(amount.getValue()).toBe(100n);
  });

  test("should throw error", () => {
    expect(() => Amount.tryFrom(BigInt(-20))).toThrow();
  });
});
