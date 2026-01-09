/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node', // Используем node для простых тестов без DOM
    setupFiles: ['./src/test/setup.ts'],
    globals: true, // Для describe, it, expect без импортов
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
