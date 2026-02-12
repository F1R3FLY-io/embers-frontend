import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      fileName: "index",
      formats: ["es"],
    },
    outDir: "dist",
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "blockly/core",
        "blockly/msg/en",
        "@blockly/plugin-cross-tab-copy-paste",
      ],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.names.includes("style.css")) {
            return "styles/blockly-overrides.css";
          }
          return assetInfo.names[0] ?? "assets/[name].[ext]";
        },
        globals: {
          "@blockly/plugin-cross-tab-copy-paste": "BlocklyCrossTabCopyPaste",
          "blockly/core": "Blockly",
          "blockly/msg/en": "BlocklyMsgEn",
          react: "React",
          "react-dom": "ReactDOM",
        },
        preserveModules: false,
      },
    },
    sourcemap: true,
  },
  plugins: [
    dts({
      tsconfigPath: "tsconfig.lib.json",
    }),
  ],
});
