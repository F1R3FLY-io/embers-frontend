export const MAX_DESCRIPTION_LENGTH = 100;

/**
 * Description entity for handling string values with a maximum length.
 */
export class Description {
  private constructor(public readonly value: string) {}

  /**
   * Creates a new Description instance.
   * @param value - The description string.
   * @throws Error if the value exceeds 100 characters.
   */
  public static tryFrom(value: string): Description {
    if (value.length <= MAX_DESCRIPTION_LENGTH) {
      return new Description(value);
    }
    throw new Error("Value greater then 100 characters");
  }

  public toString() {
    return this.value;
  }
}
