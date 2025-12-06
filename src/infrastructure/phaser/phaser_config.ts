import Phaser from 'phaser';

/**
 * Конфигурация Phaser для Script City MVP.
 * Сцены регистрируются вручную через SceneController.
 * Теги: tech:phaser, arch:renderer
 */
export function createPhaserConfig(): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-root',
    backgroundColor: '#2c3e50',
    scene: [],
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: true,
      },
    },
  };
}

