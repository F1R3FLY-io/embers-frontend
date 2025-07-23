import { Description } from "../src/entities/Description";

describe("Description class", () => {
  test("should create a Description", () => {
    const description = Description.tryFromString("test");
    expect(description).toBeDefined();
    expect(description.getValue()).toBe("test");
  });

  test("should throw error", () => {
    expect(() =>
      Description.tryFromString(
        "ABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDEABCDE",
      ),
    ).toThrow();
  });
});
