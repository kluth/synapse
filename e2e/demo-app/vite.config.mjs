import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist-e2e'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@synapse': path.resolve(__dirname, '../../src'),
    },
  },
});
