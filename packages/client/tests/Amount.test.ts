import { Amount } from "../src";

describe("Amount class", () => {
  test("should create an Amount", () => {
    const amount = Amount.tryFrom(100n);

    expect(amount).toBeDefined();
    expect(amount.value).toBe(100n);
  });

  test("should throw error", () => {
    expect(() => Amount.tryFrom(BigInt(-20))).toThrow();
  });
});
