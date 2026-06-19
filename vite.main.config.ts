import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['electron', 'xlsx', ...builtinModules, ...builtinModules.map(m => `node:${m}`)],
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
