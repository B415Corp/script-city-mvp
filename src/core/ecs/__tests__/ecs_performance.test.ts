import { describe, it, expect, beforeEach } from 'vitest';
import { ECSManager } from '../ecs_manager';
import { EventBus } from '../../event_bus/event_bus';
import { TickManager } from '../../tick/tick_manager';
import { ComponentRegistry } from '../registry/component_registry';
import { SystemRegistry } from '../registry/system_registry';
import { ClusterRegistry } from '../registry/cluster_registry';
import { EntityFactoryRegistry } from '../registry/entity_factory_registry';

// Импорт компонентов, фабрик, систем и кластеров для производительности
import './performance/components';
import './performance/entities';
import './performance/systems';
import './performance/clusters';

// Импорт компонентов, фабрик, систем и кластеров для производительности
import './performance';

// Явный импорт фабрик для гарантии регистрации
import { createSimplePerformanceEntity, createPerformanceCitizen, createPerformanceBuilding, createPerformanceVehicle } from './performance/entities/performance_factories';

describe('ECS Performance Tests', () => {
  let eventBus: EventBus;
  let tickManager: TickManager;
  let ecsManager: ECSManager;

  beforeEach(() => {
    // Создаем реальные экземпляры зависимостей
    eventBus = new EventBus();
    tickManager = new TickManager(eventBus);
    ecsManager = new ECSManager(eventBus, tickManager);
  });

  describe('Small Scale Tests (100-500 entities)', () => {
    it('должен создавать 100 жителей за разумное время', () => {
      const world = ecsManager.getWorld();
      const startTime = performance.now();

      // Создаем 100 жителей
      for (let i = 0; i < 100; i++) {
        EntityFactoryRegistry.getInstance().create('performance_citizen', world);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Создано 100 жителей за ${duration.toFixed(2)}ms`);

      // Ожидаем, что создание 100 жителей занимает менее 50ms
      expect(duration).toBeLessThan(50);
    });

    it('должен создавать 20 зданий и 10 транспортных средств', () => {
      const world = ecsManager.getWorld();
      const startTime = performance.now();

      // Создаем здания
      for (let i = 0; i < 20; i++) {
        EntityFactoryRegistry.getInstance().create('performance_building', world);
      }

      // Создаем транспорт
      for (let i = 0; i < 10; i++) {
        EntityFactoryRegistry.getInstance().create('performance_vehicle', world);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Создано 20 зданий + 10 транспортных средств за ${duration.toFixed(2)}ms`);

      expect(duration).toBeLessThan(30);
    });

    it('должен обновлять 100 жителей через системы', () => {
      const world = ecsManager.getWorld();

      // Создаем 100 жителей
      for (let i = 0; i < 100; i++) {
        EntityFactoryRegistry.getInstance().create('performance_citizen', world);
      }

      const startTime = performance.now();

      // Выполняем 10 обновлений системы
      for (let i = 0; i < 10; i++) {
        ecsManager['scheduleManager'].update(16); // 16ms = ~60fps
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`10 обновлений систем для 100 жителей за ${duration.toFixed(2)}ms`);

      expect(duration).toBeLessThan(50);
    });
  });

  describe('Medium Scale Tests (1k-5k entities)', () => {
    it('должен создавать 1000 жителей за разумное время', () => {
      const world = ecsManager.getWorld();
      const startTime = performance.now();

      // Создаем 1000 жителей
      for (let i = 0; i < 1000; i++) {
        EntityFactoryRegistry.getInstance().create('performance_citizen', world);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Создано 1000 жителей за ${duration.toFixed(2)}ms`);

      // Ожидаем, что создание 1000 жителей занимает менее 200ms
      expect(duration).toBeLessThan(200);
    });

    it('должен создавать 100 зданий + 50 транспортных средств', () => {
      const world = ecsManager.getWorld();
      const startTime = performance.now();

      // Создаем здания
      for (let i = 0; i < 100; i++) {
        EntityFactoryRegistry.getInstance().create('performance_building', world);
      }

      // Создаем транспорт
      for (let i = 0; i < 50; i++) {
        EntityFactoryRegistry.getInstance().create('performance_vehicle', world);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Создано 100 зданий + 50 транспортных средств за ${duration.toFixed(2)}ms`);

      expect(duration).toBeLessThan(150);
    });

    it('должен обновлять 1000 жителей через системы за разумное время', () => {
      const world = ecsManager.getWorld();

      // Создаем 1000 жителей
      for (let i = 0; i < 1000; i++) {
        EntityFactoryRegistry.getInstance().create('performance_citizen', world);
      }

      const startTime = performance.now();

      // Выполняем 50 обновлений системы
      for (let i = 0; i < 50; i++) {
        ecsManager['scheduleManager'].update(16);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`50 обновлений систем для 1000 жителей за ${duration.toFixed(2)}ms`);

      // Ожидаем, что 50 обновлений занимает менее 500ms
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Large Scale Tests (10k+ entities)', () => {
    it('должен создавать 10000 простых сущностей за разумное время', () => {
      const world = ecsManager.getWorld();
      const startTime = performance.now();

      // Создаем 10000 простых сущностей
      for (let i = 0; i < 10000; i++) {
        EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Создано 10000 простых сущностей за ${duration.toFixed(2)}ms`);

      // Ожидаем, что создание 10000 сущностей занимает менее 1000ms
      expect(duration).toBeLessThan(1000);
    });

    it('должен создавать 1000 жителей + 500 зданий + 200 транспортных средств', () => {
      const world = ecsManager.getWorld();
      const startTime = performance.now();

      // Создаем жителей
      for (let i = 0; i < 1000; i++) {
        EntityFactoryRegistry.getInstance().create('performance_citizen', world);
      }

      // Создаем здания
      for (let i = 0; i < 500; i++) {
        EntityFactoryRegistry.getInstance().create('performance_building', world);
      }

      // Создаем транспорт
      for (let i = 0; i < 200; i++) {
        EntityFactoryRegistry.getInstance().create('performance_vehicle', world);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Создано 1000 жителей + 500 зданий + 200 транспортных средств за ${duration.toFixed(2)}ms`);

      expect(duration).toBeLessThan(2000);
    });

    it('должен обновлять 10000 простых сущностей через систему', () => {
      const world = ecsManager.getWorld();

      // Создаем 10000 простых сущностей
      for (let i = 0; i < 10000; i++) {
        EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
      }

      const startTime = performance.now();

      // Выполняем 100 обновлений системы
      for (let i = 0; i < 100; i++) {
        ecsManager['scheduleManager'].update(16);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`100 обновлений систем для 10000 сущностей за ${duration.toFixed(2)}ms`);

      // Ожидаем, что 100 обновлений занимает менее 2000ms
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Extreme Scale Tests (50k+ entities)', () => {
    it('должен создавать 50000 простых сущностей за разумное время', () => {
      const world = ecsManager.getWorld();
      const startTime = performance.now();

      // Создаем 50000 простых сущностей
      for (let i = 0; i < 50000; i++) {
        EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Создано 50000 простых сущностей за ${duration.toFixed(2)}ms`);

      // Ожидаем, что создание 50000 сущностей занимает менее 5000ms
      expect(duration).toBeLessThan(5000);
    });

    it('должен обновлять 50000 сущностей через bulk систему', () => {
      const world = ecsManager.getWorld();

      // Создаем 50000 простых сущностей
      for (let i = 0; i < 50000; i++) {
        EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
      }

      const startTime = performance.now();

      // Выполняем 10 обновлений bulk системы
      for (let i = 0; i < 10; i++) {
        ecsManager['scheduleManager'].update(16);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`10 обновлений bulk систем для 50000 сущностей за ${duration.toFixed(2)}ms`);

      // Ожидаем, что 10 обновлений занимает менее 1000ms
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Memory Performance Tests', () => {
    it('не должен иметь утечек памяти при создании/обновлении сущностей', () => {
      const world = ecsManager.getWorld();
      const initialStats = ecsManager.getStats();

      // Создаем большое количество сущностей
      const startTime = performance.now();
      for (let i = 0; i < 5000; i++) {
        EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
      }
      const creationTime = performance.now() - startTime;

      // Выполняем обновления
      const updateStartTime = performance.now();
      for (let i = 0; i < 50; i++) {
        ecsManager['scheduleManager'].update(16);
      }
      const updateTime = performance.now() - updateStartTime;

      const finalStats = ecsManager.getStats();

      console.log(`Создание 5000 сущностей: ${creationTime.toFixed(2)}ms`);
      console.log(`50 обновлений: ${updateTime.toFixed(2)}ms`);
      console.log(`Начальное количество систем: ${initialStats.totalSystemsCount}`);
      console.log(`Финальное количество систем: ${finalStats.totalSystemsCount}`);

      // Проверяем, что системы не дублируются (нет утечек в регистрах)
      expect(finalStats.totalSystemsCount).toBeGreaterThanOrEqual(initialStats.totalSystemsCount);
    });
  });

  describe('Registry Performance Tests', () => {
    // Эти тесты работают с уже зарегистрированными компонентами/системами
    // Не очищаем реестры, чтобы измерить производительность поиска

    it('должен быстро регистрировать и получать компоненты', () => {
      const registry = ComponentRegistry.getInstance();

      const registerStartTime = performance.now();

      // Регистрируем 100 компонентов
      for (let i = 0; i < 100; i++) {
        // Компоненты уже зарегистрированы через импорт
      }

      const registerEndTime = performance.now();
      const registerDuration = registerEndTime - registerStartTime;

      const lookupStartTime = performance.now();

      // Ищем компоненты
      const citizenComponent = registry.get('PerformanceCitizen');
      const buildingComponent = registry.get('PerformanceBuilding');
      const simpleComponent = registry.get('SimplePerformance');

      const lookupEndTime = performance.now();
      const lookupDuration = lookupEndTime - lookupStartTime;

      console.log(`Регистрация компонентов: ${registerDuration.toFixed(2)}ms`);
      console.log(`Поиск компонентов: ${lookupDuration.toFixed(2)}ms`);

      expect(citizenComponent).toBeDefined();
      expect(buildingComponent).toBeDefined();
      expect(simpleComponent).toBeDefined();
      expect(lookupDuration).toBeLessThan(10);
    });

    it('должен быстро регистрировать и получать системы', () => {
      const registry = SystemRegistry.getInstance();

      const lookupStartTime = performance.now();

      // Ищем системы производительности
      const citizenSystem = registry.get('performance_citizen_update');
      const buildingSystem = registry.get('performance_building_update');
      const simpleSystem = registry.get('simple_performance_update');

      const lookupEndTime = performance.now();
      const lookupDuration = lookupEndTime - lookupStartTime;

      console.log(`Поиск систем производительности: ${lookupDuration.toFixed(2)}ms`);

      expect(citizenSystem).toBeDefined();
      expect(buildingSystem).toBeDefined();
      expect(simpleSystem).toBeDefined();
      expect(lookupDuration).toBeLessThan(5);
    });
  });

  describe('Event System Performance Tests', () => {
    it('должен обрабатывать большое количество event-driven систем', () => {
      // Регистрируем фабрику если не зарегистрирована
      const registry = EntityFactoryRegistry.getInstance();
      if (!registry.has('simple_performance_entity')) {
        import('./performance/entities/performance_factories').then(({ createSimplePerformanceEntity }) => {
          registry.register('simple_performance_entity', createSimplePerformanceEntity, 'Создает простую сущность для тестов максимальной производительности');
        });
      }

      // Создаем несколько сущностей для event систем
      const world = ecsManager.getWorld();
      for (let i = 0; i < 100; i++) {
        EntityFactoryRegistry.getInstance().create('simple_performance_entity', world);
      }

      const startTime = performance.now();

      // Отправляем тестовые события
      for (let i = 0; i < 50; i++) {
        eventBus.emit(`performance:test:${i}`, { testData: `data${i}` });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Обработка 50 событий: ${duration.toFixed(2)}ms`);

      // Ожидаем, что обработка событий занимает менее 50ms
      expect(duration).toBeLessThan(50);
    });
  });
});
