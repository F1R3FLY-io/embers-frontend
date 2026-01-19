import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'index',
      formats: ['es'],
    },
    outDir: 'dist',
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          blockly: 'Blockly',
          react: 'React',
          'react-dom': 'ReactDOM'

        },
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
