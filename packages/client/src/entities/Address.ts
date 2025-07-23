import { verify } from "../functions";

/**
 * Address entity representing a blockchain address.
 */
export class Address {
    /**
     * Constructor for Address
     * @param value String representing an address.
     */
    private constructor(private value: string) { }

    /**
     * Create an Address instance from a string.
     * @param address String representing an address.
     * @returns Address Address instance created from the string
     * @throws Error if the address is invalid
     */
    static fromString(address: string) {
        if (verify(address)) {
            return new Address(address);
        } else {
            throw new Error("Invalid address");
        }
    }

    /**
     * Convert the address to a string.
     * @returns string String representation of the address
     */
    toString() {
        return this.value;
    }
}
