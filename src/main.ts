import { EventBus } from './core/event_bus/event_bus';
import MainScene from './core/scenes/main_scene';

const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-root',
  backgroundColor: '#000001',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: true,
    },
  },
};

async function startGame(): Promise<void> {
  const eventBus = new EventBus(phaserConfig);
  await eventBus.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame);
} else {
  void startGame();
}
