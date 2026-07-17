import react from "@vitejs/plugin-react";
import path from "path";
import { defaultClientConditions, defineConfig } from "vite";
import sassDts from "vite-plugin-sass-dts";
import { viteStaticCopy } from "vite-plugin-static-copy";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    sassDts({
      enabledMode: ["development", "production"],
      esmExport: true,
    }),
    svgr({
      svgrOptions: {
        plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
        svgo: true,
        svgoConfig: {
          plugins: [
            {
              name: "removeAttrs",
              params: {
                attrs: ["svg:fill", "svg:stroke", "path:fill", "path:stroke"],
              },
            },
          ],
        },
      },
    }),
    viteStaticCopy({
      targets: [
        {
          dest: "",
          src: ["config.js"],
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    // In dev (`vite`), resolve the workspace libraries to their TypeScript
    // source via our private "f1r3fly-source" export condition. This removes
    // their `dist/` from the dev critical path entirely: no prebuild step, no
    // stale-artifact class of bug, and true HMR when editing lib source.
    //
    // In `vite build`, the condition is omitted, so the production bundle
    // consumes the published `dist/` exactly as an external consumer would.
    //
    // The spread is mandatory: `resolve.conditions` REPLACES Vite's defaults, so
    // omitting it would silently drop "module"/"browser"/"development|production"
    // and break resolution for unrelated dependencies.
    conditions:
      command === "serve"
        ? ["f1r3fly-source", ...defaultClientConditions]
        : [...defaultClientConditions],
  },
}));
