import { describe, it, expect, beforeEach } from 'vitest';
import { ECSManager } from './ecs_manager';
import { EventBus } from '../event_bus/event_bus';
import { TickManager } from '../tick/tick_manager';
import { EntityFactoryRegistry } from './registry/entity_factory_registry';
import { Events } from '../event_bus/events';

// Импорт компонентов производительности
import './__tests__/performance/components';
import './__tests__/performance/entities';
import './__tests__/performance/systems';
import './__tests__/performance/clusters';

describe('Quick Performance Test', () => {
  let eventBus: EventBus;
  let tickManager: TickManager;
  let ecsManager: ECSManager;

  beforeEach(() => {
    // Создаем реальные экземпляры зависимостей
    eventBus = new EventBus();
    tickManager = new TickManager(eventBus);
    ecsManager = new ECSManager(eventBus, tickManager);
  });

  it('should show system statistics', () => {
    const stats = ecsManager.getStats();
    console.log('📊 System Statistics:');
    console.log(`   Total systems: ${stats.totalSystemsCount}`);
    console.log(`   Clusters: ${stats.clustersCount}`);
    console.log(`   Interval systems: ${stats.intervalSystems.length}`);

    expect(stats.totalSystemsCount).toBeGreaterThan(0);
    expect(stats.clustersCount).toBeGreaterThan(0);
  });

  it('should create and update 100 entities in continuous loop', () => {
    const world = ecsManager.getWorld();

    // Создаем 100 сущностей
    const startCreate = performance.now();
    for (let i = 0; i < 100; i++) {
      EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
    }
    const createTime = performance.now() - startCreate;

    // Запускаем 100 тиков непрерывного обновления
    const startUpdate = performance.now();
    for (let tick = 0; tick < 100; tick++) {
      eventBus.emit(Events.LogicTick, { delta: 16 });

      // Каждые 10 тиков отправляем событие
      if (tick % 10 === 0) {
        eventBus.emit('performance:test_event', { tick });
      }
    }
    const updateTime = performance.now() - startUpdate;

    console.log(`⚡ Performance Results:`);
    console.log(`   Created 100 entities: ${createTime.toFixed(2)}ms`);
    console.log(`   100 continuous ticks: ${updateTime.toFixed(2)}ms`);
    console.log(`   Average FPS: ${(100 * 1000 / updateTime).toFixed(1)}`);

    expect(createTime).toBeLessThan(200);
    expect(updateTime).toBeLessThan(500);
  });
});
