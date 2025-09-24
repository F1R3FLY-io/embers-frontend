import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      fileName: (format) => `embers-client-sdk.${format}.js`,
      formats: ["es", "cjs", "umd"],
      name: "EmbersClientSdk",
    },
  },
  plugins: [
    dts({
      tsconfigPath: "tsconfig.lib.json",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
