import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClusterRegistry, ClusterMetadata } from '../cluster_registry';
import { SystemMetadata } from '../system_registry';
import { SystemFunction } from '../../core/smart_constructors';

describe('ClusterRegistry', () => {
  let registry: ClusterRegistry;

  beforeEach(() => {
    // Получаем экземпляр реестра и очищаем его перед каждым тестом
    registry = ClusterRegistry.getInstance();
    registry.clear();
  });

  describe('Singleton pattern', () => {
    it('должен возвращать один и тот же экземпляр', () => {
      const instance1 = ClusterRegistry.getInstance();
      const instance2 = ClusterRegistry.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(registry);
    });
  });

  describe('register', () => {
    it('должен успешно регистрировать кластер', () => {
      const systemNames = ['System1', 'System2'];
      const metadata: ClusterMetadata = {
        enabled: true,
        description: 'Test cluster',
        interval: 100,
      };

      registry.register('TestCluster', systemNames, metadata);

      expect(registry.has('TestCluster')).toBe(true);
      const registered = registry.get('TestCluster');
      expect(registered).toBeDefined();
      expect(registered!.name).toBe('TestCluster');
      expect(registered!.systemNames).toEqual(systemNames);
      expect(registered!.metadata).toEqual(metadata);
    });

    it('должен выбрасывать ошибку при повторной регистрации кластера', () => {
      const metadata1: ClusterMetadata = { enabled: true };
      const metadata2: ClusterMetadata = { enabled: false };

      registry.register('TestCluster', ['System1'], metadata1);

      expect(() => registry.register('TestCluster', ['System2'], metadata2)).toThrow(
        'Cluster "TestCluster" is already registered',
      );
    });

    it('должен выбрасывать ошибку при регистрации с пустым массивом systemNames', () => {
      const metadata: ClusterMetadata = { enabled: true };

      expect(() => registry.register('EmptyCluster', [], metadata)).toThrow(
        'Cluster "EmptyCluster": systemNames must be non-empty array',
      );
    });

    it('должен выбрасывать ошибку при регистрации с не-массивом systemNames', () => {
      const metadata: ClusterMetadata = { enabled: true };

      expect(() => registry.register('InvalidCluster', null as any, metadata)).toThrow(
        'Cluster "InvalidCluster": systemNames must be non-empty array',
      );
    });

    it('должен выбрасывать ошибку при регистрации с отрицательным интервалом', () => {
      const systemNames = ['System1'];
      const metadata: ClusterMetadata = { enabled: true, interval: -100 };

      expect(() => registry.register('InvalidCluster', systemNames, metadata)).toThrow(
        'Cluster "InvalidCluster": interval must be positive number',
      );
    });

    it('должен выбрасывать ошибку при регистрации с нулевым интервалом', () => {
      const systemNames = ['System1'];
      const metadata: ClusterMetadata = { enabled: true, interval: 0 };

      expect(() => registry.register('InvalidCluster', systemNames, metadata)).toThrow(
        'Cluster "InvalidCluster": interval must be positive number',
      );
    });

    it('должен позволять регистрировать кластеры с разными именами', () => {
      registry.register('Cluster1', ['System1'], { enabled: true });
      registry.register('Cluster2', ['System2'], { enabled: false });

      expect(registry.has('Cluster1')).toBe(true);
      expect(registry.has('Cluster2')).toBe(true);
      expect(registry.size()).toBe(2);
    });
  });

  describe('autoCreateFromSystemMetadata', () => {
    it('должен автоматически создавать кластеры на основе метаданных систем', () => {
      const systems = new Map<
        string,
        { name: string; system: SystemFunction; metadata: SystemMetadata }
      >([
        [
          'System1',
          { name: 'System1', system: vi.fn(), metadata: { cluster: 'gameplay', enabled: true } },
        ],
        [
          'System2',
          { name: 'System2', system: vi.fn(), metadata: { cluster: 'gameplay', enabled: false } },
        ],
        [
          'System3',
          { name: 'System3', system: vi.fn(), metadata: { cluster: 'ui', enabled: true } },
        ],
        ['System4', { name: 'System4', system: vi.fn(), metadata: { enabled: true } }], // Без кластера
      ]);

      registry.autoCreateFromSystemMetadata(systems);

      expect(registry.size()).toBe(2);
      expect(registry.has('gameplay')).toBe(true);
      expect(registry.has('ui')).toBe(true);

      const gameplayCluster = registry.get('gameplay');
      const uiCluster = registry.get('ui');

      expect(gameplayCluster!.systemNames).toEqual(['System1', 'System2']);
      expect(gameplayCluster!.metadata.enabled).toBe(true); // Есть включенная система
      expect(gameplayCluster!.metadata.description).toBe(
        'Auto-created cluster for systems: System1, System2',
      );

      expect(uiCluster!.systemNames).toEqual(['System3']);
      expect(uiCluster!.metadata.enabled).toBe(true);
    });

    it('должен правильно определять enabled статус кластера', () => {
      const systems = new Map<
        string,
        { name: string; system: SystemFunction; metadata: SystemMetadata }
      >([
        [
          'System1',
          { name: 'System1', system: vi.fn(), metadata: { cluster: 'cluster1', enabled: false } },
        ],
        [
          'System2',
          { name: 'System2', system: vi.fn(), metadata: { cluster: 'cluster1', enabled: false } },
        ],
        [
          'System3',
          { name: 'System3', system: vi.fn(), metadata: { cluster: 'cluster2', enabled: true } },
        ],
      ]);

      registry.autoCreateFromSystemMetadata(systems);

      const cluster1 = registry.get('cluster1');
      const cluster2 = registry.get('cluster2');

      expect(cluster1!.metadata.enabled).toBe(false); // Все системы отключены
      expect(cluster2!.metadata.enabled).toBe(true); // Есть включенная система
    });

    it('не должен создавать кластеры для систем без указанного кластера', () => {
      const systems = new Map<
        string,
        { name: string; system: SystemFunction; metadata: SystemMetadata }
      >([
        ['System1', { name: 'System1', system: vi.fn(), metadata: { enabled: true } }],
        ['System2', { name: 'System2', system: vi.fn(), metadata: { enabled: false } }],
      ]);

      registry.autoCreateFromSystemMetadata(systems);

      expect(registry.size()).toBe(0);
    });

    it('не должен создавать дублирующие кластеры', () => {
      // Сначала создаем кластер вручную
      registry.register('manual', ['ManualSystem'], { enabled: true });

      // Затем пытаемся создать автоматически
      const systems = new Map<
        string,
        { name: string; system: SystemFunction; metadata: SystemMetadata }
      >([
        [
          'ManualSystem',
          { name: 'ManualSystem', system: vi.fn(), metadata: { cluster: 'manual' } },
        ],
        ['OtherSystem', { name: 'OtherSystem', system: vi.fn(), metadata: { cluster: 'auto' } }],
      ]);

      registry.autoCreateFromSystemMetadata(systems);

      expect(registry.size()).toBe(2);
      expect(registry.has('manual')).toBe(true);
      expect(registry.has('auto')).toBe(true);

      const manualCluster = registry.get('manual');
      expect(manualCluster!.systemNames).toEqual(['ManualSystem']); // Не изменился
    });

    it('должен правильно группировать системы по кластерам', () => {
      const systems = new Map<
        string,
        { name: string; system: SystemFunction; metadata: SystemMetadata }
      >([
        ['Gameplay1', { name: 'Gameplay1', system: vi.fn(), metadata: { cluster: 'gameplay' } }],
        ['Gameplay2', { name: 'Gameplay2', system: vi.fn(), metadata: { cluster: 'gameplay' } }],
        ['UI1', { name: 'UI1', system: vi.fn(), metadata: { cluster: 'ui' } }],
        ['UI2', { name: 'UI2', system: vi.fn(), metadata: { cluster: 'ui' } }],
        ['UI3', { name: 'UI3', system: vi.fn(), metadata: { cluster: 'ui' } }],
        ['Physics1', { name: 'Physics1', system: vi.fn(), metadata: { cluster: 'physics' } }],
      ]);

      registry.autoCreateFromSystemMetadata(systems);

      expect(registry.size()).toBe(3);

      const gameplay = registry.get('gameplay');
      const ui = registry.get('ui');
      const physics = registry.get('physics');

      expect(gameplay!.systemNames).toEqual(['Gameplay1', 'Gameplay2']);
      expect(ui!.systemNames).toEqual(['UI1', 'UI2', 'UI3']);
      expect(physics!.systemNames).toEqual(['Physics1']);
    });
  });

  describe('get', () => {
    it('должен возвращать зарегистрированный кластер', () => {
      const metadata: ClusterMetadata = { enabled: true, description: 'Test' };
      registry.register('TestCluster', ['System1'], metadata);

      const retrieved = registry.get('TestCluster');

      expect(retrieved).toBeDefined();
      expect(retrieved!.name).toBe('TestCluster');
      expect(retrieved!.systemNames).toEqual(['System1']);
      expect(retrieved!.metadata).toEqual(metadata);
    });

    it('должен возвращать undefined для незарегистрированного кластера', () => {
      const retrieved = registry.get('NonExistentCluster');

      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('должен возвращать все зарегистрированные кластеры', () => {
      registry.register('Cluster1', ['System1'], { enabled: true });
      registry.register('Cluster2', ['System2'], { enabled: false });

      const all = registry.getAll();

      expect(all).toBeInstanceOf(Map);
      expect(all.size).toBe(2);
      expect(all.get('Cluster1')!.systemNames).toEqual(['System1']);
      expect(all.get('Cluster2')!.systemNames).toEqual(['System2']);
    });

    it('должен возвращать копию Map, а не оригинал', () => {
      registry.register('TestCluster', ['System1'], { enabled: true });

      const all = registry.getAll();

      // Изменение возвращенной Map не должно влиять на оригинал
      all.set('NewCluster', { name: 'NewCluster', systemNames: [], metadata: { enabled: false } });
      expect(registry.has('NewCluster')).toBe(false);
      expect(registry.size()).toBe(1);
    });
  });

  describe('has', () => {
    it('должен возвращать true для зарегистрированного кластера', () => {
      registry.register('TestCluster', ['System1'], { enabled: true });

      expect(registry.has('TestCluster')).toBe(true);
    });

    it('должен возвращать false для незарегистрированного кластера', () => {
      expect(registry.has('NonExistentCluster')).toBe(false);
    });
  });

  describe('clear', () => {
    it('должен очищать все зарегистрированные кластеры', () => {
      registry.register('Cluster1', ['System1'], { enabled: true });
      registry.register('Cluster2', ['System2'], { enabled: false });

      expect(registry.size()).toBe(2);

      registry.clear();

      expect(registry.size()).toBe(0);
      expect(registry.has('Cluster1')).toBe(false);
      expect(registry.has('Cluster2')).toBe(false);
    });
  });

  describe('size', () => {
    it('должен возвращать правильное количество зарегистрированных кластеров', () => {
      expect(registry.size()).toBe(0);

      registry.register('Cluster1', ['System1'], { enabled: true });
      expect(registry.size()).toBe(1);

      registry.register('Cluster2', ['System2'], { enabled: false });
      expect(registry.size()).toBe(2);
    });
  });
});
