import { Address } from "../src/entities/Address";

describe("Address class", () => {
  test("Create Address", () => {
    const address = Address.fromString(
      "1111NypGkNrhxpLKFwiZ8gLKmiwLQUyzuEe1p3nEKQCSKMvd1YHY3",
    );
    expect(address.toString()).toBe(
      "1111NypGkNrhxpLKFwiZ8gLKmiwLQUyzuEe1p3nEKQCSKMvd1YHY3",
    );
  });

  test("Expect Address.fromString to throw error", () => {
    expect(() => Address.fromString("invalid")).toThrow();
  });
});
