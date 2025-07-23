import { Amount } from "../src/entities/Amount";

describe("should create a Amount", () => {
  test("Amount tryFrom", () => {
    let amount = Amount.tryFrom(100.123);

    expect(amount).toBeDefined();
    expect(amount.getValue()).toBe(100.123);
  });

  test("should throw error", () => {
    expect(() => Amount.tryFrom(-123)).toThrow();
  });
});
