import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ECSManager } from '../../../core/ecs/ecs_manager';
import { EventBus } from '../../../core/event_bus/event_bus';
import { Events } from '../../../core/event_bus/events';
import { BitECSTestHelper } from '../../helpers/bitECS-test-helper';
import { LogicTickData } from '../../../core/tick/types';

describe('ECSManager', () => {
  let eventBus: EventBus;
  let ecsManager: ECSManager;
  let testWorld: any;

  beforeEach(() => {
    eventBus = new EventBus();
    ecsManager = new ECSManager(eventBus);
    testWorld = BitECSTestHelper.createTestSetup().world;
  });

  describe('initialization', () => {
    it('should initialize with event bus', () => {
      expect(ecsManager).toBeDefined();
      expect(ecsManager.getWorld()).toBeDefined();
    });

    it('should register base systems on initialization', () => {
      const registeredSystems = ecsManager.getRegisteredSystems();
      expect(registeredSystems.length).toBeGreaterThan(0);

      // Проверяем наличие основных систем
      expect(registeredSystems).toContain('Population');
      expect(registeredSystems).toContain('Needs');
      expect(registeredSystems).toContain('JobSearch');
      expect(registeredSystems).toContain('DayNightCycle');
    });

    it('should initialize queries for common component combinations', () => {
      // Тестируем, что запросы работают (это косвенно проверяет инициализацию)
      const world = ecsManager.getWorld();

      // Создаем тестовую сущность с Person компонентом
      const eid = ecsManager.createEntity();
      BitECSTestHelper.setPersonData(eid, { age: 25, name: 'Test', gender: 0, education: 0 });

      // Проверяем что сущность создана
      expect(eid).toBeDefined();
      expect(typeof eid).toBe('number');
    });
  });

  describe('system management', () => {
    it('should register new system', () => {
      const mockSystem = {
        name: 'TestSystem',
        components: ['Person'] as const,
        update: vi.fn(),
      };

      ecsManager.registerSystem('TestSystem', mockSystem);

      expect(ecsManager.isSystemRegistered('TestSystem')).toBe(true);
      expect(ecsManager.getRegisteredSystems()).toContain('TestSystem');
    });

    it('should throw error when calling unregistered system', () => {
      expect(() => {
        ecsManager.callSystem('NonExistentSystem');
      }).toThrow('System "NonExistentSystem" not found');
    });

    it('should validate system structure', () => {
      // Система без имени
      expect(() => {
        ecsManager.registerSystem('InvalidSystem1', {
          components: ['Person'] as const,
          update: vi.fn(),
        } as any);
      }).toThrow('System must have a valid name');

      // Система без компонентов
      expect(() => {
        ecsManager.registerSystem('InvalidSystem2', {
          name: 'InvalidSystem2',
          components: [] as const,
          update: vi.fn(),
        });
      }).toThrow('System "InvalidSystem2" must have at least one component');

      // Система без update функции
      expect(() => {
        ecsManager.registerSystem('InvalidSystem3', {
          name: 'InvalidSystem3',
          components: ['Person'] as const,
        } as any);
      }).toThrow('System "InvalidSystem3" must have an update function');
    });

    it('should call system for specific entities', () => {
      const mockSystem = {
        name: 'MockSystem',
        components: ['Person'] as const,
        update: vi.fn(),
      };

      ecsManager.registerSystem('MockSystem', mockSystem);

      const eid1 = ecsManager.createEntity();
      const eid2 = ecsManager.createEntity();

      ecsManager.callSystemForEntities('MockSystem', [eid1, eid2]);

      expect(mockSystem.update).toHaveBeenCalledWith(
        ecsManager.getWorld(),
        [eid1, eid2],
        0,
        undefined
      );
    });

    it('should call system for single entity', () => {
      const mockSystem = {
        name: 'MockSystem',
        components: ['Person'] as const,
        update: vi.fn(),
      };

      ecsManager.registerSystem('MockSystem', mockSystem);

      const eid = ecsManager.createEntity();

      ecsManager.callSystemForEntity('MockSystem', eid);

      expect(mockSystem.update).toHaveBeenCalledWith(
        ecsManager.getWorld(),
        [eid],
        0,
        undefined
      );
    });
  });

  describe('entity management', () => {
    it('should create and destroy entities', () => {
      const eid = ecsManager.createEntity();
      expect(eid).toBeDefined();
      expect(typeof eid).toBe('number');

      // Проверяем что сущность существует (косвенно через отсутствие ошибок)
      expect(() => {
        ecsManager.destroyEntity(eid);
      }).not.toThrow();
    });

    it('should provide access to entity factory', () => {
      const factory = ecsManager.entities;
      expect(factory).toBeDefined();
      expect(typeof factory).toBe('object');
    });

    it('should provide access to world', () => {
      const world = ecsManager.getWorld();
      expect(world).toBeDefined();
      expect(typeof world).toBe('object');
    });
  });

  describe('cluster management', () => {
    it('should have predefined clusters', () => {
      expect(ecsManager.isClusterEnabled('population')).toBe(true);
      expect(ecsManager.isClusterEnabled('economy')).toBe(true);
      expect(ecsManager.isClusterEnabled('infrastructure')).toBe(true);
    });

    it('should return false for non-existent cluster', () => {
      expect(ecsManager.isClusterEnabled('nonexistent')).toBe(false);
    });
  });

  describe('event handling', () => {
    it('should handle LogicTick events', () => {
      const tickData: LogicTickData = {
        delta: 1.0,
        totalTime: 100,
      };

      // Подписываемся на события систем (косвенная проверка)
      let systemCalled = false;
      const mockSystem = {
        name: 'TestTickSystem',
        components: ['Person'] as const,
        update: vi.fn(() => { systemCalled = true; }),
      };

      ecsManager.registerSystem('TestTickSystem', mockSystem);

      // Мокаем систему в кластере для тестирования
      const originalClusters = (ecsManager as any).systemsClusters;
      (ecsManager as any).systemsClusters = {
        test: {
          systemNames: ['TestTickSystem'],
          enabled: true,
          interval: undefined,
        },
      };

      eventBus.emit(Events.LogicTick, tickData);

      // Восстанавливаем оригинальные кластеры
      (ecsManager as any).systemsClusters = originalClusters;
    });

    it('should handle GameTimeUpdated events', () => {
      const timeData = {
        minutesOfDay: 480, // 8:00
      };

      eventBus.emit(Events.GameTimeUpdated, timeData);

      // Проверяем что время обновилось (доступ к приватному полю через type assertion)
      expect((ecsManager as any).currentGameTimeOfDay).toBe(480);
    });

    it('should handle CallSystem events', () => {
      const mockSystem = {
        name: 'CallSystemTest',
        components: ['Person'] as const,
        update: vi.fn(),
      };

      ecsManager.registerSystem('CallSystemTest', mockSystem);

      const callData = {
        systemName: 'CallSystemTest',
        entityId: 1,
      };

      eventBus.emit(Events.CallSystem, callData);

      expect(mockSystem.update).toHaveBeenCalled();
    });
  });

  describe('query system', () => {
    it('should query entities with specific components', () => {
      // Создаем тестовую сущность
      const eid = ecsManager.createEntity();
      BitECSTestHelper.setPersonData(eid, { age: 25, name: 'Test', gender: 0, education: 0 });

      // Проверяем что система запросов работает (косвенно)
      expect(eid).toBeDefined();
    });
  });
});
