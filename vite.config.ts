import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/ui/web-components/index.ts'),
      name: 'SynapseUI',
      fileName: () => 'synapse-ui.js',
      formats: ['es'],
    },
    outDir: 'docs',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
