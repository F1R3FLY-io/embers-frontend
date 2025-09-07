import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import sassDts from "vite-plugin-sass-dts";
// import svgr from "vite-plugin-svgr";

// Vite configuration for consist_pre-push_local-build branch
// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: {
          reactflow: ["@xyflow/react"],
          router: ["react-router-dom"],
          vendor: ["react", "react-dom"],
        },
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ["legacy-js-api"],
      },
    },
  },
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
