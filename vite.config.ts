import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/extends/*': resolve(__dirname, './src/core/modules/extends/*'),
      '@/base_modules/*': resolve(__dirname, './src/core/modules/base_modules/*'),
      '@/custom_modules/*': resolve(__dirname, './src/core/modules/custom_modules/*'),
      '@/scenes/*': resolve(__dirname, './src/core/scenes/*'),
      '@/event_bus/*': resolve(__dirname, './src/core/event_bus/*'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
