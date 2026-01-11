/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom', // Используем jsdom для тестов с DOM зависимостями
    setupFiles: ['./src/test/setup.ts'],
    globals: true, // Для describe, it, expect без импортов
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
