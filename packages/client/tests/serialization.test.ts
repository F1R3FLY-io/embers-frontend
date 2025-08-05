import { base16 } from "@scure/base";

import { PrivateKey } from "../src/entities/PrivateKey";
import { deserializeKey, serializeKey, WalletFile } from "../src/serialization";

describe("WalletFile", () => {
    const privateKey = PrivateKey.new();
    const privateKeyHex = privateKey.toHex();

    describe("fromPrivateKey", () => {
        it("should create wallet file from private key", () => {
            const walletFile = WalletFile.fromPrivateKey(privateKey);
            expect(walletFile.toJsonString()).toBe(JSON.stringify({
                keyType: "secp256k1",
                value: privateKeyHex,
                valueFormat: "hex"
            }));
        });
    });

    describe("tryFromString", () => {
        it("should parse valid wallet file string", () => {
            const fileContent = JSON.stringify({
                keyType: "secp256k1",
                value: privateKeyHex,
                valueFormat: "hex"
            });
            const walletFile = WalletFile.tryFromString(fileContent);
            expect(walletFile.value).toBe(privateKeyHex);
        });

        it("should throw on invalid key type", () => {
            const fileContent = JSON.stringify({
                keyType: "invalid",
                value: privateKeyHex,
                valueFormat: "hex"
            });
            expect(() => WalletFile.tryFromString(fileContent)).toThrow("Unsupported key type");
        });

        it("should throw on invalid format", () => {
            const fileContent = JSON.stringify({
                keyType: "secp256k1",
                value: privateKeyHex,
                valueFormat: "invalid"
            });
            expect(() => WalletFile.tryFromString(fileContent)).toThrow("Unsupported value format");
        });

        it("should throw on missing value", () => {
            const fileContent = JSON.stringify({
                keyType: "secp256k1",
                valueFormat: "hex"
            });
            expect(() => WalletFile.tryFromString(fileContent)).toThrow("Missing value");
        });

        it("should throw on empty value", () => {
            const fileContent = JSON.stringify({
                keyType: "secp256k1",
                value: "",
                valueFormat: "hex"
            });
            expect(() => WalletFile.tryFromString(fileContent)).toThrow("Empty value");
        });
    });
});

describe("serializeKey/deserializeKey", () => {
    it("should roundtrip private key through serialization", () => {
        const originalKey = PrivateKey.new();
        const serialized = serializeKey(originalKey);
        const deserialized = deserializeKey(serialized);

        expect(base16.encode(deserialized.value)).toBe(base16.encode(originalKey.value));
    });

    it("should throw on invalid serialized content", () => {
        expect(() => deserializeKey("invalid json")).toThrow();
    });
});