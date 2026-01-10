import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SystemRegistry } from '../../../core/ecs/registry/system_registry';
import { SystemFunction } from '../../../core/ecs/core/smart_constructors';

// Mock функция системы
const createMockSystem = (): SystemFunction => vi.fn();

describe('SystemRegistry', () => {
  let registry: SystemRegistry;

  beforeEach(() => {
    registry = SystemRegistry.getInstance();
    registry.clear();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SystemRegistry.getInstance();
      const instance2 = SystemRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('register', () => {
    it('should register a system successfully', () => {
      const system = createMockSystem();
      const metadata = {
        name: 'TestSystem',
        components: ['Component1'],
        cluster: 'test',
        enabled: true,
      };

      registry.register('TestSystem', system, metadata);

      expect(registry.has('TestSystem')).toBe(true);
      const registered = registry.get('TestSystem');
      expect(registered?.system).toBe(system);
      expect(registered?.metadata).toEqual(metadata);
    });

    it('should throw error when registering system with existing name', () => {
      const system1 = createMockSystem();
      const system2 = createMockSystem();
      const metadata = {
        name: 'TestSystem',
        components: ['Component1'],
        cluster: 'test',
        enabled: true,
      };

      registry.register('TestSystem', system1, metadata);

      expect(() => {
        registry.register('TestSystem', system2, metadata);
      }).toThrow('System "TestSystem" is already registered');
    });

    it('should allow registering systems with different names', () => {
      const system1 = createMockSystem();
      const system2 = createMockSystem();
      const metadata1 = {
        name: 'System1',
        components: ['Component1'],
        cluster: 'test',
        enabled: true,
      };
      const metadata2 = {
        name: 'System2',
        components: ['Component2'],
        cluster: 'test',
        enabled: true,
      };

      registry.register('System1', system1, metadata1);
      registry.register('System2', system2, metadata2);

      expect(registry.has('System1')).toBe(true);
      expect(registry.has('System2')).toBe(true);
      expect(registry.get('System1')?.system).toBe(system1);
      expect(registry.get('System2')?.system).toBe(system2);
    });
  });

  describe('get', () => {
    it('should return registered system with metadata', () => {
      const system = createMockSystem();
      const metadata = {
        name: 'TestSystem',
        components: ['Component1'],
        cluster: 'test',
        enabled: true,
      };

      registry.register('TestSystem', system, metadata);

      const retrieved = registry.get('TestSystem');
      expect(retrieved).toBeDefined();
      expect(retrieved?.system).toBe(system);
      expect(retrieved?.metadata).toEqual(metadata);
    });

    it('should return undefined for non-existent system', () => {
      const retrieved = registry.get('NonExistentSystem');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getSystemsByCluster', () => {
    it('should return systems in specific cluster', () => {
      const system1 = createMockSystem();
      const system2 = createMockSystem();
      const system3 = createMockSystem();

      registry.register('System1', system1, {
        name: 'System1',
        components: ['Component1'],
        cluster: 'cluster1',
        enabled: true,
      });
      registry.register('System2', system2, {
        name: 'System2',
        components: ['Component2'],
        cluster: 'cluster1',
        enabled: true,
      });
      registry.register('System3', system3, {
        name: 'System3',
        components: ['Component3'],
        cluster: 'cluster2',
        enabled: true,
      });

      const cluster1Systems = registry.getSystemsByCluster('cluster1');
      expect(cluster1Systems.length).toBe(2);
      expect(cluster1Systems).toContainEqual({
        name: 'System1',
        system: system1,
        metadata: expect.objectContaining({ cluster: 'cluster1' }),
      });
      expect(cluster1Systems).toContainEqual({
        name: 'System2',
        system: system2,
        metadata: expect.objectContaining({ cluster: 'cluster1' }),
      });

      const cluster2Systems = registry.getSystemsByCluster('cluster2');
      expect(cluster2Systems.length).toBe(1);
      expect(cluster2Systems[0].name).toBe('System3');
    });

    it('should return empty array for cluster with no systems', () => {
      const systems = registry.getSystemsByCluster('emptyCluster');
      expect(systems).toEqual([]);
    });
  });

  describe('has', () => {
    it('should return true for registered system', () => {
      const system = createMockSystem();
      registry.register('TestSystem', system, {
        name: 'TestSystem',
        components: [],
        cluster: 'test',
        enabled: true,
      });

      expect(registry.has('TestSystem')).toBe(true);
    });

    it('should return false for non-registered system', () => {
      expect(registry.has('NonExistentSystem')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return empty map when no systems registered', () => {
      const all = registry.getAll();
      expect(all.size).toBe(0);
    });

    it('should return all registered systems', () => {
      const system1 = createMockSystem();
      const system2 = createMockSystem();

      registry.register('System1', system1, {
        name: 'System1',
        components: [],
        cluster: 'test',
        enabled: true,
      });
      registry.register('System2', system2, {
        name: 'System2',
        components: [],
        cluster: 'test',
        enabled: true,
      });

      const all = registry.getAll();
      expect(all.size).toBe(2);
      expect(all.get('System1')?.system).toBe(system1);
      expect(all.get('System2')?.system).toBe(system2);
    });
  });

  describe('clear', () => {
    it('should remove all registered systems', () => {
      registry.register('System1', createMockSystem(), {
        name: 'System1',
        components: [],
        cluster: 'test',
        enabled: true,
      });
      registry.register('System2', createMockSystem(), {
        name: 'System2',
        components: [],
        cluster: 'test',
        enabled: true,
      });

      expect(registry.size()).toBe(2);

      registry.clear();

      expect(registry.size()).toBe(0);
      expect(registry.has('System1')).toBe(false);
      expect(registry.has('System2')).toBe(false);
    });
  });

  describe('size', () => {
    it('should return 0 for empty registry', () => {
      expect(registry.size()).toBe(0);
    });

    it('should return correct size after registering systems', () => {
      registry.register('System1', createMockSystem(), {
        name: 'System1',
        components: [],
        cluster: 'test',
        enabled: true,
      });
      expect(registry.size()).toBe(1);

      registry.register('System2', createMockSystem(), {
        name: 'System2',
        components: [],
        cluster: 'test',
        enabled: true,
      });
      expect(registry.size()).toBe(2);
    });
  });
});
