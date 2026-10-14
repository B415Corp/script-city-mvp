/// <reference types="vitest" />
import { configDefaults } from 'vitest/config';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom', // Используем jsdom для тестов с DOM зависимостями
    setupFiles: ['./src/test/setup.ts'],
    globals: true, // Для describe, it, expect без импортов
    // `npm run build` сначала запускает tsc, который компилирует тесты в dist.
    // Без этого исключения vitest прогоняет каждый тест дважды — из src и из dist.
    exclude: [...configDefaults.exclude, 'dist/**'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
