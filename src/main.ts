// Entry point for Script City MVP
// Game initialization will happen here

import Phaser from 'phaser';
import { MainScene } from './scenes/main_scene';

/**
 * Конфигурация Phaser игры
 * Теги: tech:phaser, arch:renderer
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-root',
  backgroundColor: '#2c3e50',
  scene: [MainScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: true,
    },
  },
};

/**
 * Создание и запуск игры
 */
function initGame(): void {
  const game = new Phaser.Game(config);
  console.log('Phaser game initialized');

  // Обработка изменения размера окна
  window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
  });
}

// Запускаем игру после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
