import { Core } from './core/core';
import { EventBus } from './core/event_bus/event_bus';
import { Events } from './core/event_bus/events';
import { MainScene } from './core/scenes';
import { GameTimeUpdateData } from './core/ecs/types';
import { ECSDebugStats } from './core/modules/base_modules/debug_module/components/ecs_debug';
import { TimeService } from './core/tick/time_service';
import { Logger } from './core/utils/logger';
import { ComponentRegistry } from './core/ecs/registry/component_registry';
import { SystemRegistry } from './core/ecs/registry/system_registry';
import { ClusterRegistry } from './core/ecs/registry/cluster_registry';
import { EntityFactoryRegistry } from './core/ecs/registry/entity_factory_registry';

// Импорт тестовых компонентов, систем и фабрик для проверки автоматической регистрации
import './core/ecs/components/test/test_component';
import './core/ecs/systems/test/test_system';
import './core/ecs/entities/test/test_entity_factory';

// Глобальный интерфейс для отладки
interface SimDebugMethods {
  stats: () => void;
  time: () => void;
  listenTime: () => () => void;
  getECSStats: () => ECSDebugStats;
  checkRegistries: () => void;
  testScheduleManager: (duration?: number) => void;
  testEventSystems: () => void;
  testEntityFactories: () => void;
}

// Глобальный объект для отладки
declare global {
  interface Window {
    sim: {
      stats: () => void;
      time: () => void;
      listenTime: () => () => void;
      getECSStats: () => ECSDebugStats;
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
  if (typeof window !== 'undefined' && core.eventBus && core.tickManager) {
    // Используем TimeService из TickManager
    const timeService = core.tickManager.getTimeService();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).sim = {
      stats: (): void =>
        logger.info('ECS Stats:', core.ecsManager?.getStats() || { message: 'ECS disabled' }),
      time: (): void => {
        const timeData = timeService.getTimeData();
        logger.info(`Date: ${timeData.date}, Time: ${timeData.timeOfDay}, Day ${timeData.day}`);
      },
      listenTime: (): (() => void) => {
        const handler = (data?: GameTimeUpdateData): void => logger.debug('Time update:', data);
        core.eventBus!.on(Events.GameTimeUpdated, handler);
        logger.info('Listening to time updates... (check console)');
        return () => core.eventBus!.off(Events.GameTimeUpdated, handler);
      },
      getECSStats: (): ECSDebugStats =>
        core.ecsManager?.getStats() || {
          totalSystemsCount: 0,
          clustersCount: 0,
          systems: [],
          totalEntities: 0,
          entityCounts: {},
          clusters: {},
          intervalSystems: [],
          eventSystems: {},
        },
      checkRegistries: (): void => {
        const componentRegistry = ComponentRegistry.getInstance();
        const systemRegistry = SystemRegistry.getInstance();
        const clusterRegistry = ClusterRegistry.getInstance();
        const entityFactoryRegistry = EntityFactoryRegistry.getInstance();

        logger.info('=== Component Registry ===');
        logger.info(`Components: ${componentRegistry.size()}`);
        for (const [name] of componentRegistry.getAll()) {
          logger.info(`  - ${name}`);
        }

        logger.info('=== System Registry ===');
        logger.info(`Systems: ${systemRegistry.size()}`);
        for (const [name, system] of systemRegistry.getAll()) {
          logger.info(
            `  - ${name} (cluster: ${system.metadata.cluster || 'none'}, interval: ${system.metadata.interval || 'every tick'})`,
          );
        }

        logger.info('=== Cluster Registry ===');
        logger.info(`Clusters: ${clusterRegistry.size()}`);
        for (const [name] of clusterRegistry.getAll()) {
          logger.info(`  - ${name}`);
        }

        logger.info('=== Entity Factory Registry ===');
        logger.info(`Factories: ${entityFactoryRegistry.size()}`);

        // Показываем event-driven системы и фабрики сущностей если ECSManager доступен
        if (core.ecsManager) {
          const stats = core.ecsManager.getStats();
          if (stats.eventSystems && Object.keys(stats.eventSystems).length > 0) {
            logger.info('=== Event-Driven Systems ===');
            for (const [eventName, systems] of Object.entries(stats.eventSystems)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              logger.info(`  Event "${eventName}": ${(systems as any[]).length} systems`);
            }
          }
        }

        // Показываем фабрики сущностей
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const efRegistry = (core as any).ecsRegistries.entityFactories();
        if (efRegistry.size() > 0) {
          logger.info('=== Entity Factories ===');
          logger.info(`Factories: ${efRegistry.size()}`);
          for (const [name, factory] of efRegistry.getAll()) {
            logger.info(`  - ${name}: ${factory.description || 'No description'}`);
          }
        }
      },
      testScheduleManager: (duration?: number): void => {
        if (core.ecsManager) {
          core.ecsManager.testScheduleManager(duration);
        } else {
          logger.warn('ECSManager not available');
        }
      },
      testEventSystems: (): void => {
        if (core.ecsManager) {
          core.ecsManager.testEventSystems();
        } else {
          logger.warn('ECSManager not available');
        }
      },
      testEntityFactories: (): void => {
        if (core.ecsManager) {
          core.ecsManager.testEntityFactories();
        } else {
          logger.warn('ECSManager not available');
        }
      },
    };
    logger.info('🎮 Simulation debug available in console:');
    logger.info('  sim.stats() - show simulation stats');
    logger.info('  sim.time() - show current game time');
    logger.info('  sim.listenTime() - listen to time updates');
    logger.info('  sim.checkRegistries() - show registered ECS components/systems');
    logger.info('  sim.testScheduleManager(5000) - test ScheduleManager for 5 seconds');
    logger.info('  sim.testEventSystems() - test event-driven systems');
    logger.info('  sim.testEntityFactories() - test entity factories');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame);
} else {
  void startGame();
}
