import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import sassDts from "vite-plugin-sass-dts";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sassDts({
      enabledMode: ["development", "production"],
      esmExport: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
