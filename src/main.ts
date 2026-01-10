import { Core } from './core/core';
import { EventBus } from './core/event_bus/event_bus';
import { Events } from './core/event_bus/events';
import { MainScene } from './core/scenes';
import { GameTimeUpdateData } from './core/ecs/types';
import { ECSStats } from './core/modules/base_modules/debug_module/components/ecs_debug';
import { TimeService } from './core/tick/time_service';
import { Logger } from './core/utils/logger';

// Глобальный интерфейс для отладки
interface SimDebugMethods {
  stats: () => void;
  time: () => void;
  listenTime: () => () => void;
  getECSStats: () => ECSStats;
}

// Глобальный объект для отладки
declare global {
  interface Window {
    sim: {
      stats: () => void;
      time: () => void;
      listenTime: () => () => void;
      getECSStats: () => ECSStats;
    };
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
  const logger = Logger.create('Main');
  const core = new Core(phaserConfig);
  await core.init();

  // Глобальные методы для отладки в браузерной консоли
  if (typeof window !== 'undefined' && core.eventBus && core.ecsManager && core.tickManager) {
    // Используем TimeService из TickManager
    const timeService = core.tickManager.getTimeService();

    window.sim = {
      stats: () => logger.info('ECS Stats:', core.ecsManager!.getStats()),
      time: () => {
        const timeData = timeService.getTimeData();
        logger.info(`Date: ${timeData.date}, Time: ${timeData.timeOfDay}, Day ${timeData.day}`);
      },
      listenTime: () => {
        const handler = (data?: GameTimeUpdateData) => logger.debug('Time update:', data);
        core.eventBus!.on(Events.GameTimeUpdated, handler);
        logger.info('Listening to time updates... (check console)');
        return () => core.eventBus!.off(Events.GameTimeUpdated, handler);
      },
      getECSStats: () => core.ecsManager?.getStats() || { message: 'ECS disabled in Phase 0' },
    };
    logger.info('🎮 Simulation debug available in console:');
    logger.info('  sim.stats() - show simulation stats');
    logger.info('  sim.time() - show current game time');
    logger.info('  sim.listenTime() - listen to time updates');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame);
} else {
  void startGame();
}
