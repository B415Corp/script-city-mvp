import { Core } from './core/core';
import { EventBus } from './core/event_bus/event_bus';
import { Events } from './core/event_bus/events';
import { MainScene } from './core/scenes';
import { GameTimeUpdateData } from './core/ecs/types';

// Глобальный интерфейс для отладки
interface SimDebugMethods {
  stats: () => void;
  time: () => void;
  listenTime: () => () => void;
}

declare global {
  interface Window {
    sim: SimDebugMethods;
  }
}

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
  const core = new Core(phaserConfig);
  await core.init();

  // Глобальные методы для отладки в браузерной консоли
  if (typeof window !== 'undefined') {
    window.sim = {
      stats: () => console.log(core.ecsManager.getStats()),
      time: () => {
        const timeData = core.tickManager.getTimeController().getTimeUpdateData();
        console.log(`Date: ${timeData.date}, Time: ${timeData.timeOfDay}, Day ${timeData.day}`);
      },
      listenTime: () => {
        const handler = (data?: GameTimeUpdateData) => console.log('🕐 Time update:', data);
        core.eventBus.on(Events.GameTimeUpdated, handler);
        console.log('Listening to time updates... (check console)');
        return () => core.eventBus.off(Events.GameTimeUpdated, handler);
      },
    };
    console.log('🎮 Simulation debug available in console:');
    console.log('  sim.stats() - show simulation stats');
    console.log('  sim.time() - show current game time');
    console.log('  sim.listenTime() - listen to time updates');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame);
} else {
  void startGame();
}
