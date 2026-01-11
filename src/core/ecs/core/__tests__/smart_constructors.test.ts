import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createComponent,
  createSystem,
  createCluster,
  createEntityFactory,
  SystemFunction,
} from '../smart_constructors';
import { ComponentRegistry } from '../../registry/component_registry';
import { SystemRegistry } from '../../registry/system_registry';
import { ClusterRegistry } from '../../registry/cluster_registry';
import { EntityFactoryRegistry } from '../../registry/entity_factory_registry';
import type { World } from 'bitecs';

// Моки реестров
vi.mock('../../registry/component_registry');
vi.mock('../../registry/system_registry');
vi.mock('../../registry/cluster_registry');
vi.mock('../../registry/entity_factory_registry');

describe('Умные конструкторы', () => {
  let mockComponentRegistry: ComponentRegistry;
  let mockSystemRegistry: SystemRegistry;
  let mockClusterRegistry: ClusterRegistry;
  let mockEntityFactoryRegistry: EntityFactoryRegistry;

  beforeEach(() => {
    // Очистка всех реестров перед каждым тестом
    vi.clearAllMocks();

    // Настройка моков реестров
    mockComponentRegistry = {
      register: vi.fn(),
    } as unknown as ComponentRegistry;
    mockSystemRegistry = {
      register: vi.fn(),
    } as unknown as SystemRegistry;
    mockClusterRegistry = {
      register: vi.fn(),
    } as unknown as ClusterRegistry;
    mockEntityFactoryRegistry = {
      register: vi.fn(),
    } as unknown as EntityFactoryRegistry;

    // Мокаем методы getInstance
    vi.mocked(ComponentRegistry.getInstance).mockReturnValue(mockComponentRegistry);
    vi.mocked(SystemRegistry.getInstance).mockReturnValue(mockSystemRegistry);
    vi.mocked(ClusterRegistry.getInstance).mockReturnValue(mockClusterRegistry);
    vi.mocked(EntityFactoryRegistry.getInstance).mockReturnValue(mockEntityFactoryRegistry);
  });

  describe('createComponent', () => {
    it('должен создавать компонент и регистрировать его в ComponentRegistry', () => {
      const componentName = 'TestComponent';
      const defaults = { health: 100, mana: 50 };

      const component = createComponent(componentName, defaults);

      expect(component).toBeDefined();
      expect(component.name).toBe(componentName);
      expect(component.schema).toBeDefined();

      // Проверяем, что ComponentRegistry.register был вызван
      expect(ComponentRegistry.getInstance).toHaveBeenCalled();
      expect(mockComponentRegistry.register).toHaveBeenCalledWith(componentName, component);
    });

    it('должен создавать компонент с правильной схемой', () => {
      const defaults = { x: 0, y: 0, velocity: 1.5 };
      const component = createComponent('Position', defaults);

      expect(component.schema).toBeDefined();
      expect(component.x).toBeDefined();
      expect(component.y).toBeDefined();
      expect(component.velocity).toBeDefined();
    });

    it('должен обрабатывать пустой объект defaults', () => {
      const component = createComponent('EmptyComponent', {});

      expect(component).toBeDefined();
      expect(component.name).toBe('EmptyComponent');
      expect(ComponentRegistry.getInstance).toHaveBeenCalled();
      expect(mockComponentRegistry.register).toHaveBeenCalledWith('EmptyComponent', component);
    });
  });

  describe('createSystem', () => {
    it('должен создавать систему и регистрировать её в SystemRegistry с метаданными', () => {
      const systemName = 'TestSystem';
      const components = ['TestComponent', 'Position'];
      const updateFn = vi.fn();
      const metadata = {
        cluster: 'gameplay',
        interval: 1000,
        eventTriggers: ['update'],
        enabled: true,
      };

      const system = createSystem(systemName, components, updateFn, metadata);

      expect(system).toBeDefined();
      expect(typeof system).toBe('function');

      // Проверяем, что SystemRegistry.register был вызван с правильными метаданными
      expect(SystemRegistry.getInstance).toHaveBeenCalled();
      expect(mockSystemRegistry.register).toHaveBeenCalledWith(systemName, system, {
        ...metadata,
        name: systemName, // Должен добавить имя в метаданные
      });
    });

    it('должен создавать систему, которая вызывает updateFn при выполнении', () => {
      const updateFn = vi.fn();
      const system = createSystem('TestSystem', ['TestComponent'], updateFn, {});

      const mockWorld = {} as World;
      system(mockWorld, 16.67); // Выполняем систему

      expect(updateFn).toHaveBeenCalledWith(mockWorld, [], 16.67);
    });

    it('должен обрабатывать систему с минимальными метаданными', () => {
      const updateFn = vi.fn();
      const system = createSystem('MinimalSystem', [], updateFn, { enabled: true });

      expect(system).toBeDefined();
      expect(mockSystemRegistry.register).toHaveBeenCalledWith('MinimalSystem', system, {
        enabled: true,
        name: 'MinimalSystem',
      });
    });
  });

  describe('createCluster', () => {
    it('должен регистрировать кластер в ClusterRegistry', () => {
      const clusterName = 'GameplayCluster';
      const systemNames = ['MovementSystem', 'CombatSystem'];
      const metadata = {
        enabled: true,
        description: 'Основные системы игрового процесса',
        interval: 100,
      };

      createCluster(clusterName, systemNames, metadata);

      expect(ClusterRegistry.getInstance).toHaveBeenCalled();
      expect(mockClusterRegistry.register).toHaveBeenCalledWith(clusterName, systemNames, metadata);
    });

    it('должен обрабатывать кластер с минимальными метаданными', () => {
      const clusterName = 'MinimalCluster';
      const systemNames = ['System1'];

      createCluster(clusterName, systemNames, { enabled: false });

      expect(mockClusterRegistry.register).toHaveBeenCalledWith(clusterName, systemNames, {
        enabled: false,
      });
    });
  });

  describe('createEntityFactory', () => {
    it('должен создавать функцию фабрики и регистрировать её в EntityFactoryRegistry', () => {
      const factoryName = 'PlayerFactory';
      const factoryFn = vi.fn().mockReturnValue(42);
      const description = 'Создает сущности игроков';

      const createdFactory = createEntityFactory(factoryName, factoryFn, description);

      expect(createdFactory).toBe(factoryFn); // Должен вернуть ту же функцию
      expect(EntityFactoryRegistry.getInstance).toHaveBeenCalled();
      expect(mockEntityFactoryRegistry.register).toHaveBeenCalledWith(
        factoryName,
        factoryFn,
        description,
      );
    });

    it('должен обрабатывать фабрику без описания', () => {
      const factoryName = 'EnemyFactory';
      const factoryFn = vi.fn().mockReturnValue(100);

      const createdFactory = createEntityFactory(factoryName, factoryFn);

      expect(createdFactory).toBe(factoryFn);
      expect(mockEntityFactoryRegistry.register).toHaveBeenCalledWith(
        factoryName,
        factoryFn,
        undefined,
      );
    });

    it('должен создавать фабрику, которую можно вызвать', () => {
      const factoryFn = vi.fn().mockReturnValue(123);
      const factory = createEntityFactory('TestFactory', factoryFn);

      const result = factory();

      expect(result).toBe(123);
      expect(factoryFn).toHaveBeenCalled();
    });
  });
});
