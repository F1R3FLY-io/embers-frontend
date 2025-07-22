import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import sassDts from "vite-plugin-sass-dts";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sassDts()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
