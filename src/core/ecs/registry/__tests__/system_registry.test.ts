import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SystemRegistry, SystemMetadata } from '../system_registry';
import type { World } from 'bitecs';

describe('SystemRegistry', () => {
  let registry: SystemRegistry;
  let mockSystem: () => void;

  beforeEach(() => {
    // Получаем экземпляр реестра и очищаем его перед каждым тестом
    registry = SystemRegistry.getInstance();
    registry.clear();

    // Создаем мок системы
    mockSystem = vi.fn().mockImplementation((world: World, delta?: number) => {
      // Mock system implementation
    });
  });

  describe('Singleton pattern', () => {
    it('должен возвращать один и тот же экземпляр', () => {
      const instance1 = SystemRegistry.getInstance();
      const instance2 = SystemRegistry.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(registry);
    });
  });

  describe('register', () => {
    it('должен успешно регистрировать систему с метаданными', () => {
      const metadata: SystemMetadata = {
        cluster: 'gameplay',
        interval: 1000,
        eventTriggers: ['update'],
        enabled: true,
      };

      registry.register('TestSystem', mockSystem, metadata);

      expect(registry.has('TestSystem')).toBe(true);
      const registered = registry.get('TestSystem');
      expect(registered).toBeDefined();
      expect(registered!.name).toBe('TestSystem');
      expect(registered!.system).toBe(mockSystem);
      expect(registered!.metadata).toEqual(metadata);
    });

    it('должен выбрасывать ошибку при повторной регистрации системы', () => {
      const metadata1: SystemMetadata = { enabled: true };
      const metadata2: SystemMetadata = { enabled: false };

      registry.register('TestSystem', mockSystem, metadata1);

      expect(() => registry.register('TestSystem', mockSystem, metadata2)).toThrow(
        'System "TestSystem" is already registered',
      );
    });

    it('должен выбрасывать ошибку при регистрации с отрицательным интервалом', () => {
      const metadata: SystemMetadata = { interval: -100 };

      expect(() => registry.register('InvalidSystem', mockSystem, metadata)).toThrow(
        'System "InvalidSystem": interval must be positive number',
      );
    });

    it('должен выбрасывать ошибку при регистрации с нулевым интервалом', () => {
      const metadata: SystemMetadata = { interval: 0 };

      expect(() => registry.register('InvalidSystem', mockSystem, metadata)).toThrow(
        'System "InvalidSystem": interval must be positive number',
      );
    });

    it('должен позволять регистрировать системы с разными именами', () => {
      const system1 = vi.fn();
      const system2 = vi.fn();

      registry.register('System1', system1, { enabled: true });
      registry.register('System2', system2, { enabled: false });

      expect(registry.has('System1')).toBe(true);
      expect(registry.has('System2')).toBe(true);
      expect(registry.size()).toBe(2);
    });
  });

  describe('get', () => {
    it('должен возвращать зарегистрированную систему', () => {
      const metadata: SystemMetadata = { cluster: 'test' };
      registry.register('TestSystem', mockSystem, metadata);

      const retrieved = registry.get('TestSystem');

      expect(retrieved).toBeDefined();
      expect(retrieved!.name).toBe('TestSystem');
      expect(retrieved!.system).toBe(mockSystem);
      expect(retrieved!.metadata).toEqual(metadata);
    });

    it('должен возвращать undefined для незарегистрированной системы', () => {
      const retrieved = registry.get('NonExistentSystem');

      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('должен возвращать все зарегистрированные системы', () => {
      const system1 = vi.fn();
      const system2 = vi.fn();

      registry.register('System1', system1, { cluster: 'group1' });
      registry.register('System2', system2, { cluster: 'group2' });

      const all = registry.getAll();

      expect(all).toBeInstanceOf(Map);
      expect(all.size).toBe(2);
      expect(all.get('System1')!.system).toBe(system1);
      expect(all.get('System2')!.system).toBe(system2);
    });

    it('должен возвращать копию Map, а не оригинал', () => {
      registry.register('TestSystem', mockSystem, {});

      const all = registry.getAll();

      // Изменение возвращенной Map не должно влиять на оригинал
      all.set('NewSystem', { name: 'NewSystem', system: mockSystem, metadata: {} });
      expect(registry.has('NewSystem')).toBe(false);
      expect(registry.size()).toBe(1);
    });
  });

  describe('getSystemsByCluster', () => {
    it('должен возвращать системы, принадлежащие указанному кластеру', () => {
      const system1 = vi.fn();
      const system2 = vi.fn();
      const system3 = vi.fn();

      registry.register('System1', system1, { cluster: 'gameplay' });
      registry.register('System2', system2, { cluster: 'ui' });
      registry.register('System3', system3, { cluster: 'gameplay' });

      const gameplaySystems = registry.getSystemsByCluster('gameplay');
      const uiSystems = registry.getSystemsByCluster('ui');
      const physicsSystems = registry.getSystemsByCluster('physics');

      expect(gameplaySystems).toHaveLength(2);
      expect(gameplaySystems.map((s) => s.name)).toEqual(['System1', 'System3']);
      expect(uiSystems).toHaveLength(1);
      expect(uiSystems[0].name).toBe('System2');
      expect(physicsSystems).toHaveLength(0);
    });

    it('должен возвращать пустой массив для кластера без систем', () => {
      const systems = registry.getSystemsByCluster('nonexistent');

      expect(systems).toEqual([]);
    });

    it('должен правильно работать с системами без указанного кластера', () => {
      registry.register('System1', mockSystem, { enabled: true });
      registry.register('System2', mockSystem, { cluster: 'gameplay' });

      const systems = registry.getSystemsByCluster('gameplay');

      expect(systems).toHaveLength(1);
      expect(systems[0].name).toBe('System2');
    });
  });

  describe('getIntervalSystems', () => {
    it('должен возвращать только системы с интервалами', () => {
      const system1 = vi.fn();
      const system2 = vi.fn();
      const system3 = vi.fn();

      registry.register('IntervalSystem1', system1, { interval: 1000 });
      registry.register('IntervalSystem2', system2, { interval: 2000 });
      registry.register('RegularSystem', system3, { enabled: true });

      const intervalSystems = registry.getIntervalSystems();

      expect(intervalSystems).toHaveLength(2);
      expect(intervalSystems.map((s) => s.name)).toEqual(['IntervalSystem1', 'IntervalSystem2']);
      expect(intervalSystems[0].metadata.interval).toBe(1000);
      expect(intervalSystems[1].metadata.interval).toBe(2000);
    });

    it('должен возвращать пустой массив если нет интервальных систем', () => {
      registry.register('RegularSystem', mockSystem, { enabled: true });

      const intervalSystems = registry.getIntervalSystems();

      expect(intervalSystems).toEqual([]);
    });
  });

  describe('getEventDrivenSystems', () => {
    it('должен возвращать только event-driven системы', () => {
      const system1 = vi.fn();
      const system2 = vi.fn();
      const system3 = vi.fn();

      registry.register('EventSystem1', system1, { eventTriggers: ['update'] });
      registry.register('EventSystem2', system2, { eventTriggers: ['click', 'hover'] });
      registry.register('RegularSystem', system3, { enabled: true });

      const eventSystems = registry.getEventDrivenSystems();

      expect(eventSystems).toHaveLength(2);
      expect(eventSystems.map((s) => s.name)).toEqual(['EventSystem1', 'EventSystem2']);
      expect(eventSystems[0].metadata.eventTriggers).toEqual(['update']);
      expect(eventSystems[1].metadata.eventTriggers).toEqual(['click', 'hover']);
    });

    it('должен возвращать пустой массив если нет event-driven систем', () => {
      registry.register('RegularSystem', mockSystem, { enabled: true });

      const eventSystems = registry.getEventDrivenSystems();

      expect(eventSystems).toEqual([]);
    });

    it('должен игнорировать системы с пустым массивом eventTriggers', () => {
      registry.register('SystemWithEmptyTriggers', mockSystem, { eventTriggers: [] });

      const eventSystems = registry.getEventDrivenSystems();

      expect(eventSystems).toHaveLength(0);
    });
  });

  describe('has', () => {
    it('должен возвращать true для зарегистрированной системы', () => {
      registry.register('TestSystem', mockSystem, {});

      expect(registry.has('TestSystem')).toBe(true);
    });

    it('должен возвращать false для незарегистрированной системы', () => {
      expect(registry.has('NonExistentSystem')).toBe(false);
    });
  });

  describe('clear', () => {
    it('должен очищать все зарегистрированные системы', () => {
      registry.register('System1', mockSystem, {});
      registry.register('System2', mockSystem, {});

      expect(registry.size()).toBe(2);

      registry.clear();

      expect(registry.size()).toBe(0);
      expect(registry.has('System1')).toBe(false);
      expect(registry.has('System2')).toBe(false);
    });
  });

  describe('size', () => {
    it('должен возвращать правильное количество зарегистрированных систем', () => {
      expect(registry.size()).toBe(0);

      registry.register('System1', mockSystem, {});
      expect(registry.size()).toBe(1);

      registry.register('System2', mockSystem, {});
      expect(registry.size()).toBe(2);
    });
  });
});
