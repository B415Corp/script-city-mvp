import { EventBus } from './core/event_bus/event_bus';
import MainScene from './core/scenes/main_scene';

export interface PhaserConfig {
  type: number;
  width: number;
  height: number;
  scene: typeof MainScene;
}

const phaserConfig: PhaserConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  scene: MainScene,
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
