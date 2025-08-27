import { Description, MAX_DESCRIPTION_LENGTH } from "../src";

describe("Description class", () => {
  test("should create a Description", () => {
    const description = Description.tryFrom("test");
    expect(description).toBeDefined();
    expect(description.value).toBe("test");
  });

  test("should throw error", () => {
    expect(() =>
      Description.tryFrom("A".repeat(MAX_DESCRIPTION_LENGTH + 1)),
    ).toThrow();
  });
});
