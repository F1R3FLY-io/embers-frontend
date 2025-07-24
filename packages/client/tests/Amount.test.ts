import { Amount } from "../src/entities/Amount";

describe("should create a Amount", () => {
  test("Amount tryFrom", () => {
    const amount = Amount.tryFrom(100n);

    expect(amount).toBeDefined();
    expect(amount.getValue()).toBe(100n);
  });

  test("should throw error", () => {
    expect(() => Amount.tryFrom(BigInt(-20))).toThrow();
  });
});
