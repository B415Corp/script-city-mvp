import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScheduleManager } from '../ecs_manager';
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

    mockWorld = { id: 'mock-world' };
    mockSystem = vi.fn();

    mockEventBus = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      clearEvents: vi.fn(),
    };

    mockSystemRegistry = {
      get: vi
        .fn()
        .mockReturnValue({ name: 'MockSystem', system: mockSystem, metadata: { enabled: true } }),
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

  describe('registerSystem', () => {
    it('должен регистрировать обычную систему', () => {
      const testSystem = vi.fn();

      scheduleManager.registerSystem(testSystem);

      const systems = scheduleManager.getSystems();
      expect(systems).toContain(testSystem);
      expect(systems).toHaveLength(1);
    });

    it('должен позволять регистрировать несколько систем', () => {
      const system1 = vi.fn();
      const system2 = vi.fn();
      const system3 = vi.fn();

      scheduleManager.registerSystem(system1);
      scheduleManager.registerSystem(system2);
      scheduleManager.registerSystem(system3);

      const systems = scheduleManager.getSystems();
      expect(systems).toHaveLength(3);
      expect(systems).toContain(system1);
      expect(systems).toContain(system2);
      expect(systems).toContain(system3);
    });
  });

  describe('registerIntervalSystem', () => {
    it('должен регистрировать систему с интервалом выполнения', () => {
      const systemName = 'IntervalSystem';
      const interval = 2000;

      scheduleManager.registerIntervalSystem(systemName, mockSystem, interval);

      const intervalSystems = scheduleManager.getIntervalSystems();
      expect(intervalSystems).toHaveLength(1);
      expect(intervalSystems[0]).toEqual({
        system: mockSystem,
        name: systemName,
        interval: interval,
        lastExecuted: 0, // Начинается с 0
      });
    });

    it('должен позволять регистрировать несколько интервальных систем', () => {
      const system1 = vi.fn();
      const system2 = vi.fn();

      scheduleManager.registerIntervalSystem('System1', system1, 1000);
      scheduleManager.registerIntervalSystem('System2', system2, 2000);

      const intervalSystems = scheduleManager.getIntervalSystems();
      expect(intervalSystems).toHaveLength(2);
      expect(intervalSystems[0].name).toBe('System1');
      expect(intervalSystems[1].name).toBe('System2');
    });
  });

  describe('updateCluster', () => {
    it('должен выполнять все системы в кластере каждый тик при отсутствии интервала', () => {
      const system1 = vi.fn();
      const system2 = vi.fn();
      const systems = [system1, system2];
      const deltaTime = 16.67;

      scheduleManager.updateCluster('TestCluster', systems, deltaTime);

      expect(system1).toHaveBeenCalledWith(mockWorld, deltaTime);
      expect(system2).toHaveBeenCalledWith(mockWorld, deltaTime);
    });

    it('должен выполнять системы в кластере с интервалом только когда время истекло', () => {
      const system1 = vi.fn();
      const system2 = vi.fn();
      const systems = [system1, system2];
      const deltaTime = 100;
      const interval = 200;

      // Первый вызов - не должно выполниться (100 < 200)
      scheduleManager.updateCluster('TestCluster', systems, deltaTime, interval);
      expect(system1).not.toHaveBeenCalled();
      expect(system2).not.toHaveBeenCalled();

      // Второй вызов - должно выполниться (200 >= 200)
      scheduleManager.updateCluster('TestCluster', systems, deltaTime, interval);
      expect(system1).toHaveBeenCalledWith(mockWorld, deltaTime);
      expect(system2).toHaveBeenCalledWith(mockWorld, deltaTime);
    });

    it('должен сбрасывать таймер после выполнения интервальной системы', () => {
      const system = vi.fn();
      const systems = [system];
      const deltaTime = 150;
      const interval = 200;

      // Первый вызов - таймер = 150
      scheduleManager.updateCluster('TestCluster', systems, deltaTime, interval);
      expect(system).not.toHaveBeenCalled();

      // Второй вызов - таймер = 150 + 150 = 300 >= 200, выполнение + сброс
      scheduleManager.updateCluster('TestCluster', systems, deltaTime, interval);
      expect(system).toHaveBeenCalledTimes(1);

      // Третий вызов - таймер = 150 < 200, не выполняется
      scheduleManager.updateCluster('TestCluster', systems, deltaTime, interval);
      expect(system).toHaveBeenCalledTimes(1);
    });

    it('должен логировать ошибки выполнения систем в кластере', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failingSystem = vi.fn().mockImplementation(() => {
        throw new Error('System failed');
      });
      const normalSystem = vi.fn();
      const systems = [failingSystem, normalSystem];

      scheduleManager.updateCluster('TestCluster', systems, 16.67);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ScheduleManager] Error in cluster TestCluster:',
        expect.any(Error),
      );
      expect(failingSystem).toHaveBeenCalled();
      expect(normalSystem).toHaveBeenCalled(); // Нормальная система всё равно выполняется

      consoleSpy.mockRestore();
    });
  });

  describe('update', () => {
    beforeEach(() => {
      // Очищаем интервальные системы для каждого теста
      vi.clearAllMocks();
      scheduleManager = new ScheduleManager(
        mockWorld,
        mockEventBus as unknown as EventBus,
        mockSystemRegistry as unknown as SystemRegistry,
        mockClusterRegistry as unknown as ClusterRegistry,
      );
    });

    it('должен обновлять игровое время при каждом вызове', () => {
      const initialGameTime = (scheduleManager as any).gameTime;

      scheduleManager.update(100);

      expect((scheduleManager as any).gameTime).toBe(initialGameTime + 144000); // GAME_TIME_PER_TICK = 144000
    });

    it('должен выполнять кластеры при каждом обновлении', () => {
      const mockCluster = {
        name: 'TestCluster',
        systemNames: ['System1'],
        metadata: { enabled: true },
      };
      const mockRegisteredSystem = {
        name: 'System1',
        system: mockSystem,
        metadata: { enabled: true },
      };

      vi.mocked(mockClusterRegistry.getAll).mockReturnValue(
        new Map([['TestCluster', mockCluster]]),
      );
      vi.mocked(mockSystemRegistry.get).mockReturnValue(mockRegisteredSystem);

      scheduleManager.update(16.67);

      expect(mockSystem).toHaveBeenCalledWith(mockWorld, 16.67);
    });

    it('должен пропускать отключенные кластеры', () => {
      const mockCluster = {
        name: 'DisabledCluster',
        systemNames: ['System1'],
        metadata: { enabled: false },
      };

      vi.mocked(mockClusterRegistry.getAll).mockReturnValue(
        new Map([['DisabledCluster', mockCluster]]),
      );

      scheduleManager.update(16.67);

      expect(mockSystem).not.toHaveBeenCalled();
    });

    it('должен выполнять интервальные системы когда пришло время', () => {
      const intervalSystem = {
        system: mockSystem,
        name: 'IntervalSystem',
        interval: 200000, // 200 секунд (больше чем GAME_TIME_PER_TICK = 144000ms)
        lastExecuted: 0,
      };

      // Добавляем интервальную систему напрямую для теста
      (scheduleManager as any).intervalSystems = [intervalSystem];
      vi.mocked(mockSystemRegistry.get).mockReturnValue({
        name: 'IntervalSystem',
        system: mockSystem,
        metadata: { enabled: true },
      });

      // Первый вызов - время = 144000, пора выполнять (144000 > 200000? Нет, 144000 < 200000)
      scheduleManager.update(100);
      expect(mockSystem).not.toHaveBeenCalled();

      // Второй вызов - время = 144000 + 144000 = 288000, пора выполнять (288000 > 200000)
      scheduleManager.update(100);
      expect(mockSystem).toHaveBeenCalledWith(mockWorld, 100);
      expect(intervalSystem.lastExecuted).toBe(288000);
    });

    it('должен пропускать отключенные интервальные системы', () => {
      const intervalSystem = {
        system: mockSystem,
        name: 'DisabledIntervalSystem',
        interval: 100,
        lastExecuted: 0,
      };

      (scheduleManager as any).intervalSystems = [intervalSystem];
      vi.mocked(mockSystemRegistry.get).mockReturnValue({
        name: 'DisabledIntervalSystem',
        system: mockSystem,
        metadata: { enabled: false },
      });

      scheduleManager.update(200);

      expect(mockSystem).not.toHaveBeenCalled();
    });

    it('должен логировать ошибки выполнения интервальных систем', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failingSystem = vi.fn().mockImplementation(() => {
        throw new Error('Interval system failed');
      });

      const intervalSystem = {
        system: failingSystem,
        name: 'FailingIntervalSystem',
        interval: 100000, // 100 секунд (меньше чем GAME_TIME_PER_TICK = 144000ms)
        lastExecuted: 0,
      };

      (scheduleManager as any).intervalSystems = [intervalSystem];
      vi.mocked(mockSystemRegistry.get).mockReturnValue({
        name: 'FailingIntervalSystem',
        system: failingSystem,
        metadata: { enabled: true },
      });

      scheduleManager.update(100);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ScheduleManager] Error in interval system FailingIntervalSystem:',
        expect.any(Error),
      );
      expect(failingSystem).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getSystems', () => {
    it('должен возвращать массив зарегистрированных систем', () => {
      const system1 = vi.fn();
      const system2 = vi.fn();

      scheduleManager.registerSystem(system1);
      scheduleManager.registerSystem(system2);

      const systems = scheduleManager.getSystems();

      expect(systems).toHaveLength(2);
      expect(systems).toContain(system1);
      expect(systems).toContain(system2);
    });

    it('должен возвращать пустой массив если системы не зарегистрированы', () => {
      const systems = scheduleManager.getSystems();

      expect(systems).toEqual([]);
    });
  });

  describe('getIntervalSystems', () => {
    it('должен возвращать массив интервальных систем', () => {
      const system1 = vi.fn();
      const system2 = vi.fn();

      scheduleManager.registerIntervalSystem('System1', system1, 1000);
      scheduleManager.registerIntervalSystem('System2', system2, 2000);

      const intervalSystems = scheduleManager.getIntervalSystems();

      expect(intervalSystems).toHaveLength(2);
      expect(intervalSystems[0].name).toBe('System1');
      expect(intervalSystems[1].name).toBe('System2');
    });

    it('должен возвращать пустой массив если интервальные системы не зарегистрированы', () => {
      const intervalSystems = scheduleManager.getIntervalSystems();

      expect(intervalSystems).toEqual([]);
    });
  });

  describe('initClusterTimer', () => {
    it('должен инициализировать таймер для кластера', () => {
      scheduleManager.initClusterTimer('TestCluster');

      const timers = (scheduleManager as any).clusterTimers;
      expect(timers.get('TestCluster')).toBe(0);
    });

    it('должен позволять инициализировать таймеры для разных кластеров', () => {
      scheduleManager.initClusterTimer('Cluster1');
      scheduleManager.initClusterTimer('Cluster2');

      const timers = (scheduleManager as any).clusterTimers;
      expect(timers.get('Cluster1')).toBe(0);
      expect(timers.get('Cluster2')).toBe(0);
    });
  });

  describe('комплексные сценарии', () => {
    it('должен правильно комбинировать обычные и интервальные системы', () => {
      // Регистрируем интервальную систему
      const intervalSystem = vi.fn();
      scheduleManager.registerIntervalSystem('IntervalSystem', intervalSystem, 300000); // 300 секунд (5 минут)

      // Настраиваем кластеры с интервальной системой
      const mockCluster = {
        name: 'TestCluster',
        systemNames: ['IntervalSystem'],
        metadata: { enabled: true },
      };
      const mockRegisteredSystem = {
        name: 'IntervalSystem',
        system: intervalSystem,
        metadata: { enabled: true, interval: 300000 },
      };

      vi.mocked(mockClusterRegistry.getAll).mockReturnValue(
        new Map([['TestCluster', mockCluster]]),
      );
      vi.mocked(mockSystemRegistry.get).mockReturnValue(mockRegisteredSystem);

      // Первый тик - интервальная система не выполняется (144000 < 300000)
      scheduleManager.update(100);
      expect(intervalSystem).not.toHaveBeenCalled();

      // Второй тик - интервальная система не выполняется (144000 + 144000 = 288000 < 300000)
      scheduleManager.update(100);
      expect(intervalSystem).not.toHaveBeenCalled();

      // Третий тик - интервальная система выполняется (288000 + 144000 = 432000 >= 300000)
      scheduleManager.update(100);
      expect(intervalSystem).toHaveBeenCalledTimes(1);
    });

    it('должен корректно работать с несколькими кластерами', () => {
      const system1 = vi.fn();
      const system2 = vi.fn();
      const system3 = vi.fn();

      const clusters = new Map([
        [
          'Cluster1',
          {
            name: 'Cluster1',
            systemNames: ['System1'],
            metadata: { enabled: true },
          },
        ],
        [
          'Cluster2',
          {
            name: 'Cluster2',
            systemNames: ['System2', 'System3'],
            metadata: { enabled: true },
          },
        ],
      ]);

      vi.mocked(mockClusterRegistry.getAll).mockReturnValue(clusters);
      vi.mocked(mockSystemRegistry.get)
        .mockReturnValueOnce({ name: 'System1', system: system1, metadata: { enabled: true } })
        .mockReturnValueOnce({ name: 'System2', system: system2, metadata: { enabled: true } })
        .mockReturnValueOnce({ name: 'System3', system: system3, metadata: { enabled: true } });

      scheduleManager.update(16.67);

      expect(system1).toHaveBeenCalledWith(mockWorld, 16.67);
      expect(system2).toHaveBeenCalledWith(mockWorld, 16.67);
      expect(system3).toHaveBeenCalledWith(mockWorld, 16.67);
    });
  });
});
