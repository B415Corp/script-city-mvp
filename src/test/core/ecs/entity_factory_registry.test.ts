import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityFactoryRegistry } from '../../../core/ecs/registry/entity_factory_registry';

// Mock функция фабрики
const createMockFactory = (): (() => number) => vi.fn(() => 42);

describe('EntityFactoryRegistry', () => {
  let registry: EntityFactoryRegistry;

  beforeEach(() => {
    registry = EntityFactoryRegistry.getInstance();
    registry.clear();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EntityFactoryRegistry.getInstance();
      const instance2 = EntityFactoryRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('register', () => {
    it('should register a factory successfully', () => {
      const factory = createMockFactory();
      const description = 'Test factory';

      registry.register('TestFactory', factory, description);

      expect(registry.has('TestFactory')).toBe(true);
      const registered = registry.get('TestFactory');
      expect(registered?.factory).toBe(factory);
      expect(registered?.description).toBe(description);
    });

    it('should register factory without description', () => {
      const factory = createMockFactory();

      registry.register('TestFactory', factory);

      const registered = registry.get('TestFactory');
      expect(registered?.factory).toBe(factory);
      expect(registered?.description).toBeUndefined();
    });

    it('should throw error when registering factory with existing name', () => {
      const factory1 = createMockFactory();
      const factory2 = createMockFactory();

      registry.register('TestFactory', factory1, 'Description 1');

      expect(() => {
        registry.register('TestFactory', factory2, 'Description 2');
      }).toThrow('Entity factory "TestFactory" is already registered');
    });

    it('should allow registering factories with different names', () => {
      const factory1 = createMockFactory();
      const factory2 = createMockFactory();

      registry.register('Factory1', factory1, 'Factory 1');
      registry.register('Factory2', factory2, 'Factory 2');

      expect(registry.has('Factory1')).toBe(true);
      expect(registry.has('Factory2')).toBe(true);
      expect(registry.get('Factory1')?.factory).toBe(factory1);
      expect(registry.get('Factory2')?.factory).toBe(factory2);
    });
  });

  describe('get', () => {
    it('should return registered factory with description', () => {
      const factory = createMockFactory();
      const description = 'Test factory description';

      registry.register('TestFactory', factory, description);

      const retrieved = registry.get('TestFactory');
      expect(retrieved).toBeDefined();
      expect(retrieved?.factory).toBe(factory);
      expect(retrieved?.description).toBe(description);
    });

    it('should return undefined for non-existent factory', () => {
      const retrieved = registry.get('NonExistentFactory');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create entity using registered factory', () => {
      const mockFactory = vi.fn(() => 123);
      registry.register('TestFactory', mockFactory);

      const entityId = registry.create('TestFactory');

      expect(mockFactory).toHaveBeenCalledTimes(1);
      expect(entityId).toBe(123);
    });

    it('should throw error when creating entity with non-existent factory', () => {
      expect(() => {
        registry.create('NonExistentFactory');
      }).toThrow('Entity factory "NonExistentFactory" not found');
    });
  });

  describe('has', () => {
    it('should return true for registered factory', () => {
      const factory = createMockFactory();
      registry.register('TestFactory', factory);

      expect(registry.has('TestFactory')).toBe(true);
    });

    it('should return false for non-registered factory', () => {
      expect(registry.has('NonExistentFactory')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return empty map when no factories registered', () => {
      const all = registry.getAll();
      expect(all.size).toBe(0);
    });

    it('should return all registered factories', () => {
      const factory1 = createMockFactory();
      const factory2 = createMockFactory();

      registry.register('Factory1', factory1, 'Factory 1');
      registry.register('Factory2', factory2, 'Factory 2');

      const all = registry.getAll();
      expect(all.size).toBe(2);
      expect(all.get('Factory1')?.factory).toBe(factory1);
      expect(all.get('Factory1')?.description).toBe('Factory 1');
      expect(all.get('Factory2')?.factory).toBe(factory2);
      expect(all.get('Factory2')?.description).toBe('Factory 2');
    });

    it('should return a copy, not the original map', () => {
      registry.register('TestFactory', createMockFactory());

      const all = registry.getAll();
      const mockFactoryData = { factory: createMockFactory(), description: 'Mock' };
      all.set('NewFactory', mockFactoryData); // Попытка модифицировать

      expect(registry.has('NewFactory')).toBe(false);
      expect(registry.size()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should remove all registered factories', () => {
      registry.register('Factory1', createMockFactory());
      registry.register('Factory2', createMockFactory());

      expect(registry.size()).toBe(2);

      registry.clear();

      expect(registry.size()).toBe(0);
      expect(registry.has('Factory1')).toBe(false);
      expect(registry.has('Factory2')).toBe(false);
    });
  });

  describe('size', () => {
    it('should return 0 for empty registry', () => {
      expect(registry.size()).toBe(0);
    });

    it('should return correct size after registering factories', () => {
      registry.register('Factory1', createMockFactory());
      expect(registry.size()).toBe(1);

      registry.register('Factory2', createMockFactory());
      expect(registry.size()).toBe(2);
    });
  });

  describe('factory execution', () => {
    it('should call factory function when creating entity', () => {
      const mockFactory = vi.fn(() => 999);
      registry.register('TestFactory', mockFactory);

      const result = registry.create('TestFactory');

      expect(mockFactory).toHaveBeenCalledTimes(1);
      expect(result).toBe(999);
    });

    it('should allow factory to return different entity IDs', () => {
      let counter = 0;
      const mockFactory = vi.fn(() => ++counter);

      registry.register('CounterFactory', mockFactory);

      expect(registry.create('CounterFactory')).toBe(1);
      expect(registry.create('CounterFactory')).toBe(2);
      expect(registry.create('CounterFactory')).toBe(3);
      expect(mockFactory).toHaveBeenCalledTimes(3);
    });

    it('should handle factory throwing errors', () => {
      const errorFactory = vi.fn(() => {
        throw new Error('Factory error');
      });
      registry.register('ErrorFactory', errorFactory);

      expect(() => {
        registry.create('ErrorFactory');
      }).toThrow('Factory error');
      expect(errorFactory).toHaveBeenCalledTimes(1);
    });
  });

  describe('factory descriptions', () => {
    it('should store and retrieve factory descriptions', () => {
      const factory = createMockFactory();
      const description = 'Creates player entities with default stats';

      registry.register('PlayerFactory', factory, description);

      const retrieved = registry.get('PlayerFactory');
      expect(retrieved?.description).toBe(description);
    });

    it('should handle undefined descriptions', () => {
      const factory = createMockFactory();

      registry.register('SimpleFactory', factory);

      const retrieved = registry.get('SimpleFactory');
      expect(retrieved?.description).toBeUndefined();
    });

    it('should handle empty string descriptions', () => {
      const factory = createMockFactory();

      registry.register('EmptyDescFactory', factory, '');

      const retrieved = registry.get('EmptyDescFactory');
      expect(retrieved?.description).toBe('');
    });
  });
});
