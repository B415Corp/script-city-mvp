// Entry point for Script City MVP
// Game initialization will happen here

import { bootstrapGame } from './app/game_app';
import { debugLog } from './infrastructure/utils/logger';

/**
 * Точка входа: запускает GameApp (Phaser + GameCore).
 * Теги: arch:app, tech:phaser
 */
async function startGame(): Promise<void> {
  try {
    // 1. Инициализация игры
    await bootstrapGame();
    debugLog('🌆 Инициализация игры завершена');
  } catch (error) {
    console.error('Ошибка при инициализации игры', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame);
} else {
  void startGame();
}
