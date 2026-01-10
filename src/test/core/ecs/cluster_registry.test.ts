import { describe, it, expect, beforeEach } from 'vitest';
import { ClusterRegistry } from '../../../core/ecs/registry/cluster_registry';

describe('ClusterRegistry', () => {
  let registry: ClusterRegistry;

  beforeEach(() => {
    registry = ClusterRegistry.getInstance();
    registry.clear();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ClusterRegistry.getInstance();
      const instance2 = ClusterRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('register', () => {
    it('should register a cluster successfully', () => {
      const systemNames = ['System1', 'System2'];
      const metadata = { enabled: true, description: 'Test cluster' };

      registry.register('TestCluster', systemNames, metadata);

      expect(registry.has('TestCluster')).toBe(true);
      const registered = registry.get('TestCluster');
      expect(registered?.systemNames).toEqual(systemNames);
      expect(registered?.metadata).toEqual(metadata);
    });

    it('should throw error when registering cluster with existing name', () => {
      const systemNames1 = ['System1'];
      const systemNames2 = ['System2'];
      const metadata = { enabled: true, description: 'Test cluster' };

      registry.register('TestCluster', systemNames1, metadata);

      expect(() => {
        registry.register('TestCluster', systemNames2, metadata);
      }).toThrow('Cluster "TestCluster" is already registered');
    });

    it('should allow registering clusters with different names', () => {
      const metadata1 = { enabled: true, description: 'Cluster 1' };
      const metadata2 = { enabled: false, description: 'Cluster 2' };

      registry.register('Cluster1', ['System1'], metadata1);
      registry.register('Cluster2', ['System2'], metadata2);

      expect(registry.has('Cluster1')).toBe(true);
      expect(registry.has('Cluster2')).toBe(true);
      expect(registry.get('Cluster1')?.systemNames).toEqual(['System1']);
      expect(registry.get('Cluster2')?.systemNames).toEqual(['System2']);
    });
  });

  describe('get', () => {
    it('should return registered cluster with metadata', () => {
      const systemNames = ['System1', 'System2'];
      const metadata = { enabled: true, description: 'Test cluster' };

      registry.register('TestCluster', systemNames, metadata);

      const retrieved = registry.get('TestCluster');
      expect(retrieved).toBeDefined();
      expect(retrieved?.systemNames).toEqual(systemNames);
      expect(retrieved?.metadata).toEqual(metadata);
    });

    it('should return undefined for non-existent cluster', () => {
      const retrieved = registry.get('NonExistentCluster');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for registered cluster', () => {
      registry.register('TestCluster', ['System1'], { enabled: true });

      expect(registry.has('TestCluster')).toBe(true);
    });

    it('should return false for non-registered cluster', () => {
      expect(registry.has('NonExistentCluster')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return empty map when no clusters registered', () => {
      const all = registry.getAll();
      expect(all.size).toBe(0);
    });

    it('should return all registered clusters', () => {
      registry.register('Cluster1', ['System1'], { enabled: true });
      registry.register('Cluster2', ['System2'], { enabled: false });

      const all = registry.getAll();
      expect(all.size).toBe(2);
      expect(all.get('Cluster1')?.systemNames).toEqual(['System1']);
      expect(all.get('Cluster2')?.systemNames).toEqual(['System2']);
    });

    it('should return a copy, not the original map', () => {
      registry.register('TestCluster', ['System1'], { enabled: true });

      const all = registry.getAll();
      const mockCluster = { systemNames: ['Mock'], metadata: { enabled: false } };
      all.set('NewCluster', mockCluster); // Попытка модифицировать

      expect(registry.has('NewCluster')).toBe(false);
      expect(registry.size()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should remove all registered clusters', () => {
      registry.register('Cluster1', ['System1'], { enabled: true });
      registry.register('Cluster2', ['System2'], { enabled: true });

      expect(registry.size()).toBe(2);

      registry.clear();

      expect(registry.size()).toBe(0);
      expect(registry.has('Cluster1')).toBe(false);
      expect(registry.has('Cluster2')).toBe(false);
    });
  });

  describe('size', () => {
    it('should return 0 for empty registry', () => {
      expect(registry.size()).toBe(0);
    });

    it('should return correct size after registering clusters', () => {
      registry.register('Cluster1', ['System1'], { enabled: true });
      expect(registry.size()).toBe(1);

      registry.register('Cluster2', ['System2'], { enabled: true });
      expect(registry.size()).toBe(2);
    });
  });

  describe('cluster metadata', () => {
    it('should store and retrieve cluster metadata correctly', () => {
      const metadata = {
        enabled: true,
        description: 'Gameplay cluster',
        interval: 100,
      };

      registry.register('Gameplay', ['Movement', 'Combat'], metadata);

      const retrieved = registry.get('Gameplay');
      expect(retrieved?.metadata).toEqual(metadata);
      expect(retrieved?.metadata.enabled).toBe(true);
      expect(retrieved?.metadata.description).toBe('Gameplay cluster');
      expect(retrieved?.metadata.interval).toBe(100);
    });

    it('should handle optional metadata properties', () => {
      const minimalMetadata = { enabled: false };

      registry.register('Minimal', ['System1'], minimalMetadata);

      const retrieved = registry.get('Minimal');
      expect(retrieved?.metadata).toEqual(minimalMetadata);
      expect(retrieved?.metadata.enabled).toBe(false);
      expect(retrieved?.metadata.description).toBeUndefined();
      expect(retrieved?.metadata.interval).toBeUndefined();
    });
  });

  describe('system names validation', () => {
    it('should throw error for empty system names array', () => {
      expect(() => {
        registry.register('EmptyCluster', [], { enabled: true });
      }).toThrow('Cluster "EmptyCluster": systemNames must be non-empty array');
    });

    it('should store large system names array', () => {
      const systemNames = ['System1', 'System2', 'System3', 'System4', 'System5'];

      registry.register('LargeCluster', systemNames, { enabled: true });

      const retrieved = registry.get('LargeCluster');
      expect(retrieved?.systemNames).toEqual(systemNames);
      expect(retrieved?.systemNames.length).toBe(5);
    });
  });
});
