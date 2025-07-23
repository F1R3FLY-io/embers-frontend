import { Address } from "../src/entities/Address";

describe("Address class", () => {
  test("Create Address", () => {
    const address = Address.tryFrom(
      "1111NypGkNrhxpLKFwiZ8gLKmiwLQUyzuEe1p3nEKQCSKMvd1YHY3",
    );
    expect(address.getValue()).toBe(
      "1111NypGkNrhxpLKFwiZ8gLKmiwLQUyzuEe1p3nEKQCSKMvd1YHY3",
    );
  });

  test("Expect Address.fromString to throw error", () => {
    expect(() => Address.tryFrom("invalid")).toThrow();
  });
});
