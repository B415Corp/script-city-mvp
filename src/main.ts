import { Core } from './core/core';
import { EventBus } from './core/event_bus/event_bus';
import { Events } from './core/event_bus/events';
import { MainScene } from './core/scenes';
import { GameTimeUpdateData } from './core/ecs/types';
import { ECSStats } from './core/modules/base_modules/debug_module/components/ecs_debug';
import { TimeService } from './core/tick/time_service';

// Глобальный интерфейс для отладки
interface SimDebugMethods {
  stats: () => void;
  time: () => void;
  timeService: () => void;
  listenTime: () => () => void;
  getECSStats: () => ECSStats;
  checkTimeConditions: () => void;
}

// Глобальный объект для отладки
declare global {
  interface Window {
    sim: any;
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
    // Создаем TimeService для отладки
    const timeService = TimeService.createFromEventBus(core.eventBus);

    window.sim = {
      stats: () => console.log(core.ecsManager.getStats()),
      time: () => {
        const timeData = core.tickManager.getTimeController().getTimeUpdateData();
        console.log(`Date: ${timeData.date}, Time: ${timeData.timeOfDay}, Day ${timeData.day}`);
      },
      timeService: () => {
        const debugInfo = timeService.getDebugInfo();
        console.log('⏰ TimeService Debug Info:', debugInfo);
        console.log('📅 Current time string:', timeService.toString());
        console.log('🏢 Is work hours:', timeService.isWorkHours());
        console.log('🏖️ Is weekend:', timeService.isWeekend());
        console.log('🌙 Is night time:', timeService.isNightTime());
      },
      listenTime: () => {
        const handler = (data?: GameTimeUpdateData) => console.log('🕐 Time update:', data);
        core.eventBus.on(Events.GameTimeUpdated, handler);
        console.log('Listening to time updates... (check console)');
        return () => core.eventBus.off(Events.GameTimeUpdated, handler);
      },
      checkTimeConditions: () => {
        console.log('🔍 Time Conditions:');
        console.log('  Morning (6:00-12:00):', timeService.isMorningTime());
        console.log('  Afternoon (12:00-18:00):', timeService.isAfternoonTime());
        console.log('  Evening (18:00-22:00):', timeService.isEveningTime());
        console.log('  Night (22:00-6:00):', timeService.isNightTime());
        console.log('  Work Hours (9:00-17:00):', timeService.isWorkHours());
        console.log('  Firing Time (18:00-20:00):', timeService.isFiringTime());
        console.log('  Weekend:', timeService.isWeekend());
        console.log('  Current condition:', timeService.getCurrentTimeCondition());
      },
      getECSStats: () => core.ecsManager.getStats(),
    };
    console.log('🎮 Simulation debug available in console:');
    console.log('  sim.stats() - show simulation stats');
    console.log('  sim.time() - show current game time');
    console.log('  sim.timeService() - show TimeService debug info');
    console.log('  sim.checkTimeConditions() - check all time conditions');
    console.log('  sim.listenTime() - listen to time updates');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame);
} else {
  void startGame();
}
