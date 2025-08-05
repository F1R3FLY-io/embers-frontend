import { base16 } from "@scure/base";

import { PrivateKey } from "./entities/PrivateKey";

/**
 * Represents the format of a wallet file.
 * @interface
 * @property {string} keyType - The type of the cryptographic key. Currently only supports 'secp256k1'.
 * @property {string} value - The actual value/content of the wallet key.
 * @property {string} valueFormat - The format in which the value is stored. Currently only supports 'hex'.
 */
type WalletFileFormat = {
  keyType: "secp256k1";
  value: string;
  valueFormat: "hex";
};

/**
 * Extracts and verifies the secp256k1 key type from a wallet file format object
 * @param file - Partial wallet file format object containing key type information
 * @returns The string literal 'secp256k1' if the key type matches
 * @throws {Error} If the key type is not 'secp256k1'
 */
export function getSecp256k1(file: Partial<WalletFileFormat>): "secp256k1" {
  if (file.keyType === "secp256k1") {
    return "secp256k1";
  }
  throw new Error("Unsupported key type");
}

/**
 * Validates that the value format is hexadecimal
 * @param file - Partial wallet file format object containing value format information
 * @returns The string literal 'hex' if the value format matches
 * @throws {Error} If the value format is not 'hex'
 */
export function getHexFormat(file: Partial<WalletFileFormat>): "hex" {
  if (file.valueFormat === "hex") {
    return "hex";
  }
  throw new Error("Unsupported value format");
}

/**
 * Retrieves the value from a wallet file format object after validation
 * @param file - Partial wallet file format object containing value information
 * @returns The value string if it exists and is non-empty
 * @throws {Error} If the value is missing or empty
 */
export function getValue(file: Partial<WalletFileFormat>): string {
  if (file.value === undefined) {
    throw new Error("Missing value");
  }
  if (file.value.length === 0) {
    throw new Error("Empty value");
  }

  return file.value;
}

/**
 * Represents a wallet file structure containing cryptographic key information
 */
export class WalletFile {
  /**
   * Private constructor to enforce usage of static factory methods
   * @param keyType - Cryptographic key type (always 'secp256k1')
   * @param value - Encoded key value
   * @param valueFormat - Value format (always 'hex')
   */
  private constructor(
    private readonly keyType: "secp256k1",
    public readonly value: string,
    private readonly valueFormat: "hex",
  ) {}

  /**
   * Creates a WalletFile instance from a PrivateKey object
   * @param key - PrivateKey instance to be serialized
   * @returns WalletFile containing the encoded private key
   */
  public static fromPrivateKey(key: PrivateKey): WalletFile {
    return new WalletFile("secp256k1", base16.encode(key.value), "hex");
  }

  /**
   * Attempts to create a WalletFile instance from a JSON string
   * @param fileContent - JSON string representing wallet file format
   * @returns WalletFile instance if validation succeeds
   * @throws {Error} If any validation checks fail
   */
  public static tryFromString(fileContent: string): WalletFile {
    const untrustedFile = JSON.parse(fileContent) as Partial<WalletFileFormat>;

    const keyType = getSecp256k1(untrustedFile);
    const format = getHexFormat(untrustedFile);
    const value = getValue(untrustedFile);

    return new WalletFile(keyType, value, format);
  }

  /**
   * Converts the wallet file to a JSON string representation
   * @returns Stringified JSON object containing wallet file metadata
   */
  public toJsonString(): string {
    return JSON.stringify({
      keyType: this.keyType,
      value: this.value,
      valueFormat: this.valueFormat,
    });
  }
}

/**
 * Serializes a PrivateKey to a wallet file format string
 * @param key - PrivateKey instance to be serialized
 * @returns JSON string representing the wallet file format
 */
export function serializeKey(key: PrivateKey): string {
  const walletFile = WalletFile.fromPrivateKey(key);
  return walletFile.toJsonString();
}

/**
 * Deserializes a wallet file string back to a PrivateKey
 * @param fileContent - JSON string containing wallet file data
 * @returns PrivateKey instance if deserialization succeeds
 * @throws {Error} If any validation checks fail
 */
export function deserializeKey(fileContent: string): PrivateKey {
  const walletFile = WalletFile.tryFromString(fileContent);
  return PrivateKey.tryFromHex(walletFile.value);
}
