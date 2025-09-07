import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import sassDts from "vite-plugin-sass-dts";
// import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sassDts({
      enabledMode: ["development", "production"],
      esmExport: true,
    }),
    // Temporarily disable svgr to fix build issues
    // svgr({
    //   svgrOptions: {
    //     plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
    //     svgo: true,
    //     svgoConfig: {
    //       plugins: [
    //         {
    //           name: "removeAttrs",
    //           params: {
    //             attrs: ["svg:fill", "svg:stroke", "path:fill", "path:stroke"],
    //           },
    //         },
    //       ],
    //     },
    //   },
    // }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
