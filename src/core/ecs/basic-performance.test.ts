import { describe, it, expect, beforeEach } from 'vitest';
import { ECSManager } from './ecs_manager';
import { EventBus } from '../event_bus/event_bus';
import { TickManager } from '../tick/tick_manager';
import { EntityFactoryRegistry } from './registry/entity_factory_registry';

// Импорт компонентов производительности
import './__tests__/performance/components';
import './__tests__/performance/entities';
import './__tests__/performance/systems';
import './__tests__/performance/clusters';

describe('Basic ECS Performance Tests', () => {
  let eventBus: EventBus;
  let tickManager: TickManager;
  let ecsManager: ECSManager;

  beforeEach(() => {
    // Создаем реальные экземпляры зависимостей
    eventBus = new EventBus();
    tickManager = new TickManager(eventBus);
    ecsManager = new ECSManager(eventBus, tickManager);
  });

  describe('Entity Creation Performance', () => {
    it('должен создавать 10 простых сущностей быстро', () => {
      const world = ecsManager.getWorld();
      const startTime = performance.now();

      // Создаем 10 простых сущностей
      const entities = [];
      for (let i = 0; i < 10; i++) {
        const entityId = EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
        entities.push(entityId);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Создано 10 сущностей за ${duration.toFixed(2)}ms`);

      expect(entities).toHaveLength(10);
      expect(duration).toBeLessThan(50);
    });

    it('должен создавать 50 простых сущностей', () => {
      const world = ecsManager.getWorld();
      const startTime = performance.now();

      // Создаем 50 простых сущностей
      const entities = [];
      for (let i = 0; i < 50; i++) {
        const entityId = EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
        entities.push(entityId);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Создано 50 сущностей за ${duration.toFixed(2)}ms`);

      expect(entities).toHaveLength(50);
      expect(duration).toBeLessThan(200);
    });
  });

  describe('System Update Performance', () => {
    it('должен обновлять 10 сущностей через системы', () => {
      const world = ecsManager.getWorld();

      // Создаем 10 сущностей
      for (let i = 0; i < 10; i++) {
        EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
      }

      const startTime = performance.now();

      // Выполняем 5 обновлений системы
      for (let i = 0; i < 5; i++) {
        ecsManager['scheduleManager'].update(16);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`5 обновлений систем для 10 сущностей за ${duration.toFixed(2)}ms`);

      expect(duration).toBeLessThan(100);
    });
  });
});
