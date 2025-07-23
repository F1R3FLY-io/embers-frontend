const MAX_DESCRIPTION_LENGTH = 100;

/**
 * Description entity for handling string values with a maximum length.
 */
export class Description {

    private constructor(private value: string) { }

    /**
     * Creates a new Description instance.
     * @param value - The description string.
     * @throws Error if the value exceeds 100 characters.
     */
    public static tryFromString(value: string) {
        if (value.length <= MAX_DESCRIPTION_LENGTH) {
            return new Description(value)
        } else {
            throw new Error("Value greater then 100 characters")
        }
    }

    /**
     * Gets the value of the description.
     * @returns The description string.
     */
    public getValue() {
        return this.value;
    }
}