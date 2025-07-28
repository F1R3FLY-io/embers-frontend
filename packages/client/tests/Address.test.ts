import { Address } from "../src/entities/Address";

describe("Address class", () => {
  test("should create an Address", () => {
    const address = Address.tryFrom(
      "1111NypGkNrhxpLKFwiZ8gLKmiwLQUyzuEe1p3nEKQCSKMvd1YHY3",
    );
    expect(address.value).toBe(
      "1111NypGkNrhxpLKFwiZ8gLKmiwLQUyzuEe1p3nEKQCSKMvd1YHY3",
    );
  });

  test("should throw error", () => {
    expect(() => Address.tryFrom("invalid")).toThrow();
  });
});
