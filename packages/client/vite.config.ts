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
  // No "@" alias on purpose. This package is consumed from source in dev (via the
  // "f1r3fly-source" export condition), and the app defines its own "@" -> its own
  // src. Vite's resolve.alias is global/importer-agnostic, so a "@/" import here
  // would resolve into the APP's src and break. Dropping the alias turns any such
  // import into a hard compile error instead of a silent mis-resolution.
});
