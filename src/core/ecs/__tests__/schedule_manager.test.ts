import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScheduleManager, GAME_TIME_PER_TICK } from '../ecs_manager';
import { EventBus } from '../../event_bus/event_bus';
import { SystemRegistry } from '../registry/system_registry';
import { ClusterRegistry } from '../registry/cluster_registry';
import { World } from 'bitecs';
import { SystemFunction } from '../core/smart_constructors';

describe('ScheduleManager', () => {
  let scheduleManager: ScheduleManager;
  let mockWorld: World;
  let mockEventBus: {
    emit: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
    once: ReturnType<typeof vi.fn>;
    clearEvents: ReturnType<typeof vi.fn>;
  };
  let mockSystemRegistry: { get: ReturnType<typeof vi.fn> };
  let mockClusterRegistry: { getAll: ReturnType<typeof vi.fn> };
  let mockSystem: SystemFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockWorld = { id: 'mock-world' } as unknown as World;
    mockSystem = vi.fn();

    mockEventBus = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      clearEvents: vi.fn(),
    };

    mockSystemRegistry = {
      get: vi.fn().mockReturnValue({ name: 'MockSystem', system: mockSystem, metadata: {} }),
    };

    mockClusterRegistry = {
      getAll: vi.fn().mockReturnValue(new Map()),
    };

    scheduleManager = new ScheduleManager(
      mockWorld,
      mockEventBus as unknown as EventBus,
      mockSystemRegistry as unknown as SystemRegistry,
      mockClusterRegistry as unknown as ClusterRegistry,
    );
  });

  function createScheduleManager(): ScheduleManager {
    return new ScheduleManager(
      mockWorld,
      mockEventBus as unknown as EventBus,
      mockSystemRegistry as unknown as SystemRegistry,
      mockClusterRegistry as unknown as ClusterRegistry,
    );
  }

  describe('registerSystem', () => {
    it('должен регистрировать обычную систему', () => {
      const testSystem = vi.fn();

      scheduleManager.registerSystem('TestSystem', testSystem);

      const systems = scheduleManager.getSystems();
      expect(systems).toHaveLength(1);
      expect(systems[0].name).toBe('TestSystem');
      expect(systems[0].system).toBe(testSystem);
    });

    it('должен позволять регистрировать несколько систем', () => {
      scheduleManager.registerSystem('System1', vi.fn());
      scheduleManager.registerSystem('System2', vi.fn());
      scheduleManager.registerSystem('System3', vi.fn());

      expect(scheduleManager.getSystems()).toHaveLength(3);
    });
  });

  describe('update: per-tick системы', () => {
    it('должен выполнять зарегистрированную систему каждый тик', () => {
      const system = vi.fn();
      scheduleManager.registerSystem('PerTick', system);

      scheduleManager.update(16);
      scheduleManager.update(16);

      expect(system).toHaveBeenCalledTimes(2);
      expect(system).toHaveBeenCalledWith(mockWorld, 16);
    });

    it('должен выполнять per-tick систему даже если она не найдена в SystemRegistry', () => {
      vi.mocked(mockSystemRegistry.get).mockReturnValue(undefined);
      const system = vi.fn();
      scheduleManager.registerSystem('Unregistered', system);

      scheduleManager.update(16);

      expect(system).toHaveBeenCalledTimes(1);
    });

    it('должен пропускать отключенную per-tick систему', () => {
      vi.mocked(mockSystemRegistry.get).mockReturnValue({
        name: 'Disabled',
        system: mockSystem,
        metadata: { enabled: false },
      });
      scheduleManager.registerSystem('Disabled', mockSystem);

      scheduleManager.update(16);

      expect(mockSystem).not.toHaveBeenCalled();
    });

    it('должен пропускать event-driven систему, зарегистрированную как per-tick', () => {
      vi.mocked(mockSystemRegistry.get).mockReturnValue({
        name: 'EventDriven',
        system: mockSystem,
        metadata: { eventTriggers: ['some:event'] },
      });
      scheduleManager.registerSystem('EventDriven', mockSystem);

      scheduleManager.update(16);

      expect(mockSystem).not.toHaveBeenCalled();
    });

    it('не должен падать, если система бросает исключение', () => {
      const failing = vi.fn().mockImplementation(() => {
        throw new Error('boom');
      });
      const healthy = vi.fn();
      scheduleManager.registerSystem('Failing', failing);
      scheduleManager.registerSystem('Healthy', healthy);

      expect(() => scheduleManager.update(16)).not.toThrow();
      expect(healthy).toHaveBeenCalledTimes(1);
    });
  });

  describe('registerIntervalSystem', () => {
    it('должен регистрировать систему с интервалом выполнения', () => {
      scheduleManager.registerIntervalSystem('IntervalSystem', mockSystem, 2000);

      const intervalSystems = scheduleManager.getIntervalSystems();
      expect(intervalSystems).toHaveLength(1);
      expect(intervalSystems[0]).toEqual({
        system: mockSystem,
        name: 'IntervalSystem',
        interval: 2000,
        lastExecuted: 0,
      });
    });

    it('должен позволять регистрировать несколько интервальных систем', () => {
      scheduleManager.registerIntervalSystem('System1', vi.fn(), 1000);
      scheduleManager.registerIntervalSystem('System2', vi.fn(), 2000);

      expect(scheduleManager.getIntervalSystems()).toHaveLength(2);
    });
  });

  describe('update: игровое время', () => {
    it('должен обновлять игровое время при каждом вызове', () => {
      scheduleManager.update(100);

      expect((scheduleManager as unknown as { gameTime: number }).gameTime).toBe(
        GAME_TIME_PER_TICK,
      );
    });
  });

  describe('update: кластеры', () => {
    it('должен выполнять системы кластера каждый тик', () => {
      const system1 = vi.fn();
      vi.mocked(mockClusterRegistry.getAll).mockReturnValue(
        new Map([
          [
            'TestCluster',
            {
              name: 'TestCluster',
              systemNames: ['System1', 'System2'],
              metadata: { enabled: true },
            },
          ],
        ]),
      );
      vi.mocked(mockSystemRegistry.get)
        .mockReturnValueOnce({ name: 'System1', system: system1, metadata: {} })
        .mockReturnValueOnce({ name: 'System2', system: mockSystem, metadata: {} });

      scheduleManager.update(16);

      expect(system1).toHaveBeenCalledWith(mockWorld, 16);
      expect(mockSystem).toHaveBeenCalledWith(mockWorld, 16);
    });

    it('должен пропускать отключенные кластеры', () => {
      vi.mocked(mockClusterRegistry.getAll).mockReturnValue(
        new Map([
          [
            'DisabledCluster',
            {
              name: 'DisabledCluster',
              systemNames: ['System1'],
              metadata: { enabled: false },
            },
          ],
        ]),
      );

      scheduleManager.update(16);

      expect(mockSystem).not.toHaveBeenCalled();
    });

    it('должен уважать интервал кластера', () => {
      const system = vi.fn();
      vi.mocked(mockClusterRegistry.getAll).mockReturnValue(
        new Map([
          [
            'SlowCluster',
            {
              name: 'SlowCluster',
              systemNames: ['System1'],
              metadata: { enabled: true, interval: 200 },
            },
          ],
        ]),
      );
      vi.mocked(mockSystemRegistry.get).mockReturnValue({
        name: 'System1',
        system,
        metadata: {},
      });

      scheduleManager.update(100);
      expect(system).not.toHaveBeenCalled();

      scheduleManager.update(100);
      expect(system).toHaveBeenCalledTimes(1);

      scheduleManager.update(100);
      expect(system).toHaveBeenCalledTimes(1);
    });

    it('должен логировать предупреждение и продолжить, если система не найдена', () => {
      vi.mocked(mockClusterRegistry.getAll).mockReturnValue(
        new Map([
          [
            'TestCluster',
            {
              name: 'TestCluster',
              systemNames: ['Missing', 'System1'],
              metadata: { enabled: true },
            },
          ],
        ]),
      );
      vi.mocked(mockSystemRegistry.get)
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce({ name: 'System1', system: mockSystem, metadata: {} });

      expect(() => scheduleManager.update(16)).not.toThrow();
      expect(mockSystem).toHaveBeenCalledTimes(1);
    });
  });

  describe('update: интервальные системы', () => {
    it('должен выполнять интервальную систему когда пришло время', () => {
      const intervalSystem = {
        system: mockSystem,
        name: 'IntervalSystem',
        interval: 200000, // больше чем GAME_TIME_PER_TICK
        lastExecuted: 0,
      };
      vi.mocked(mockClusterRegistry.getAll).mockReturnValue(new Map());
      vi.mocked(mockSystemRegistry.get).mockReturnValue({
        name: 'IntervalSystem',
        system: mockSystem,
        metadata: {},
      });
      (scheduleManager as unknown as { intervalSystems: unknown[] }).intervalSystems = [
        intervalSystem,
      ];

      scheduleManager.update(100);
      expect(mockSystem).not.toHaveBeenCalled();

      scheduleManager.update(100);
      expect(mockSystem).toHaveBeenCalledWith(mockWorld, 100);
      expect(intervalSystem.lastExecuted).toBe(GAME_TIME_PER_TICK * 2);
    });

    it('должен пропускать отключенные интервальные системы', () => {
      vi.mocked(mockClusterRegistry.getAll).mockReturnValue(new Map());
      vi.mocked(mockSystemRegistry.get).mockReturnValue({
        name: 'DisabledIntervalSystem',
        system: mockSystem,
        metadata: { enabled: false },
      });
      (scheduleManager as unknown as { intervalSystems: unknown[] }).intervalSystems = [
        { system: mockSystem, name: 'DisabledIntervalSystem', interval: 100, lastExecuted: 0 },
      ];

      scheduleManager.update(200);

      expect(mockSystem).not.toHaveBeenCalled();
    });

    it('не должен выполнять интервальную систему дважды за тик', () => {
      const system = vi.fn();
      vi.mocked(mockClusterRegistry.getAll).mockReturnValue(
        new Map([
          [
            'TestCluster',
            {
              name: 'TestCluster',
              systemNames: ['IntervalSystem'],
              metadata: { enabled: true },
            },
          ],
        ]),
      );
      vi.mocked(mockSystemRegistry.get).mockReturnValue({
        name: 'IntervalSystem',
        system,
        metadata: { interval: 100 },
      });
      scheduleManager.registerIntervalSystem('IntervalSystem', system, 100);

      scheduleManager.update(100);
      scheduleManager.update(100);
      scheduleManager.update(100);

      expect(system).toHaveBeenCalledTimes(3);
    });
  });

  describe('getSystems', () => {
    it('должен возвращать массив зарегистрированных систем', () => {
      scheduleManager.registerSystem('System1', vi.fn());
      scheduleManager.registerSystem('System2', vi.fn());

      expect(scheduleManager.getSystems()).toHaveLength(2);
    });

    it('должен возвращать пустой массив если системы не зарегистрированы', () => {
      expect(scheduleManager.getSystems()).toEqual([]);
    });
  });

  describe('getIntervalSystems', () => {
    it('должен возвращать массив интервальных систем', () => {
      scheduleManager.registerIntervalSystem('System1', vi.fn(), 1000);
      scheduleManager.registerIntervalSystem('System2', vi.fn(), 2000);

      expect(scheduleManager.getIntervalSystems()).toHaveLength(2);
    });

    it('должен возвращать пустой массив если интервальные системы не зарегистрированы', () => {
      expect(scheduleManager.getIntervalSystems()).toEqual([]);
    });
  });

  describe('initClusterTimer', () => {
    it('должен инициализировать таймер для кластера', () => {
      scheduleManager.initClusterTimer('TestCluster');

      const timers = (scheduleManager as unknown as { clusterTimers: Map<string, number> })
        .clusterTimers;
      expect(timers.get('TestCluster')).toBe(0);
    });

    it('должен позволять инициализировать таймеры для разных кластеров', () => {
      scheduleManager.initClusterTimer('Cluster1');
      scheduleManager.initClusterTimer('Cluster2');

      const timers = (scheduleManager as unknown as { clusterTimers: Map<string, number> })
        .clusterTimers;
      expect(timers.size).toBe(2);
    });
  });

  describe('destroy', () => {
    it('должен очищать системы, интервальные системы и таймеры', () => {
      vi.mocked(mockClusterRegistry.getAll).mockReturnValue(new Map());
      scheduleManager.registerSystem('System1', vi.fn());
      scheduleManager.registerIntervalSystem('System2', vi.fn(), 1000);
      scheduleManager.initClusterTimer('Cluster1');

      scheduleManager.destroy();

      expect(scheduleManager.getSystems()).toEqual([]);
      expect(scheduleManager.getIntervalSystems()).toEqual([]);
      expect((scheduleManager as unknown as { gameTime: number }).gameTime).toBe(0);
    });
  });

  describe('комплексные сценарии', () => {
    it('должен правильно комбинировать обычные и интервальные системы', () => {
      vi.mocked(mockClusterRegistry.getAll).mockReturnValue(new Map());
      const intervalSystem = vi.fn();
      vi.mocked(mockSystemRegistry.get).mockReturnValue({
        name: 'IntervalSystem',
        system: intervalSystem,
        metadata: {},
      });
      scheduleManager.registerIntervalSystem('IntervalSystem', intervalSystem, 300000);

      // 144000 < 300000
      scheduleManager.update(100);
      expect(intervalSystem).not.toHaveBeenCalled();

      // 288000 < 300000
      scheduleManager.update(100);
      expect(intervalSystem).not.toHaveBeenCalled();

      // 432000 >= 300000
      scheduleManager.update(100);
      expect(intervalSystem).toHaveBeenCalledTimes(1);
    });

    it('должен корректно работать с несколькими кластерами', () => {
      const system1 = vi.fn();
      const system2 = vi.fn();
      const system3 = vi.fn();

      vi.mocked(mockClusterRegistry.getAll).mockReturnValue(
        new Map([
          ['Cluster1', { name: 'Cluster1', systemNames: ['System1'], metadata: { enabled: true } }],
          [
            'Cluster2',
            {
              name: 'Cluster2',
              systemNames: ['System2', 'System3'],
              metadata: { enabled: true },
            },
          ],
        ]),
      );
      vi.mocked(mockSystemRegistry.get)
        .mockReturnValueOnce({ name: 'System1', system: system1, metadata: {} })
        .mockReturnValueOnce({ name: 'System2', system: system2, metadata: {} })
        .mockReturnValueOnce({ name: 'System3', system: system3, metadata: {} });

      scheduleManager.update(16);

      expect(system1).toHaveBeenCalledWith(mockWorld, 16);
      expect(system2).toHaveBeenCalledWith(mockWorld, 16);
      expect(system3).toHaveBeenCalledWith(mockWorld, 16);
    });

    it('per-tick система и система кластера выполняются независимо', () => {
      const perTick = vi.fn();
      const clustered = vi.fn();

      vi.mocked(mockClusterRegistry.getAll).mockReturnValue(
        new Map([
          [
            'Cluster1',
            { name: 'Cluster1', systemNames: ['Clustered'], metadata: { enabled: true } },
          ],
        ]),
      );
      vi.mocked(mockSystemRegistry.get).mockImplementation((name: string) =>
        name === 'Clustered'
          ? { name: 'Clustered', system: clustered, metadata: {} }
          : { name: 'Standalone', system: perTick, metadata: {} },
      );

      scheduleManager = createScheduleManager();
      scheduleManager.registerSystem('Standalone', perTick);

      scheduleManager.update(16);

      expect(perTick).toHaveBeenCalledTimes(1);
      expect(clustered).toHaveBeenCalledTimes(1);
    });
  });
});
