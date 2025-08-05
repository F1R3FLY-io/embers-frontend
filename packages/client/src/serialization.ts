import { base16 } from "@scure/base";

import { PrivateKey } from "./entities/PrivateKey";

type WalletFileFormat = {
  keyType: 'secp256k1';
  value: string;
  valueFormat: 'hex';
};

export function getSecp256k1(file: Partial<WalletFileFormat>): 'secp256k1' {
  if (file.keyType === 'secp256k1') {
    return 'secp256k1';
  }
  throw new Error("Unsupported key type");
}

export function getHexFormat(file: Partial<WalletFileFormat>): 'hex' {
  if (file.valueFormat === 'hex') {
    return 'hex';
  }
  throw new Error("Unsupported value format");
}

export function getValue(file: Partial<WalletFileFormat>): string {
  if (file.value === undefined) {
    throw new Error("Missing value");
  }
  if (file.value.length === 0) {
    throw new Error("Empty value");
  }

  return file.value;
}

export class WalletFile {

  private constructor(
    private readonly keyType: 'secp256k1',
    public readonly value: string,
    private readonly valueFormat: 'hex') { }

  public static fromPrivateKey(key: PrivateKey): WalletFile {
    return new WalletFile('secp256k1', base16.encode(key.value), 'hex');
  }

  public static tryFromString(fileContent: string): WalletFile {
    const untrustedFile = JSON.parse(fileContent) as Partial<WalletFileFormat>;

    const keyType = getSecp256k1(untrustedFile);
    const format = getHexFormat(untrustedFile);
    const value = getValue(untrustedFile);

    return new WalletFile(keyType, value, format);
  }

  public toJsonString(): string {
    return JSON.stringify({
      keyType: this.keyType,
      value: this.value,
      valueFormat: this.valueFormat,
    });
  }
}

export function serializeKey(key: PrivateKey): string {
  const walletFile = WalletFile.fromPrivateKey(key);

  return walletFile.toJsonString();
}

export function deserializeKey(fileContent: string): PrivateKey {
  const walletFile = WalletFile.tryFromString(fileContent);

  return PrivateKey.tryFromHex(walletFile.value);
}
