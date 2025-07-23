import { createDefaultEsmPreset  } from "ts-jest";

const tsJestTransformCfg = createDefaultEsmPreset().transform;

/** @type {import("jest").Config} **/
export default {
    testEnvironment: "node",
    transformIgnorePatterns: [
        "/node_modules/(?!@noble/secp256k1)", // let jest transpile it
    ],
    coveragePathIgnorePatterns: [
        "<rootDir>/src/api-client",
    ],
    transform: {
        ...tsJestTransformCfg,
    },
};
