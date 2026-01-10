import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentRegistry } from '../../../core/ecs/registry/component_registry';
import { createSimpleComponent } from '../../../core/ecs/core/component_schema';

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry;

  beforeEach(() => {
    // Получить singleton instance и очистить его для тестов
    registry = ComponentRegistry.getInstance();
    registry.clear();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ComponentRegistry.getInstance();
      const instance2 = ComponentRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('register', () => {
    it('should register a component successfully', () => {
      const component = createSimpleComponent('TestComponent', { value: 0 });

      registry.register('TestComponent', component);

      expect(registry.has('TestComponent')).toBe(true);
      expect(registry.get('TestComponent')).toBe(component);
    });

    it('should throw error when registering component with existing name', () => {
      const component1 = createSimpleComponent('TestComponent', { value: 0 });
      const component2 = createSimpleComponent('AnotherComponent', { value: 0 });

      registry.register('TestComponent', component1);

      expect(() => {
        registry.register('TestComponent', component2);
      }).toThrow('Component "TestComponent" is already registered');
    });

    it('should allow registering multiple components with different names', () => {
      const component1 = createSimpleComponent('Component1', { value: 0 });
      const component2 = createSimpleComponent('Component2', { value: 0 });

      registry.register('Component1', component1);
      registry.register('Component2', component2);

      expect(registry.has('Component1')).toBe(true);
      expect(registry.has('Component2')).toBe(true);
      expect(registry.get('Component1')).toBe(component1);
      expect(registry.get('Component2')).toBe(component2);
    });
  });

  describe('get', () => {
    it('should return registered component', () => {
      const component = createSimpleComponent('TestComponent', { value: 0 });
      registry.register('TestComponent', component);

      const retrieved = registry.get('TestComponent');
      expect(retrieved).toBe(component);
    });

    it('should return undefined for non-existent component', () => {
      const retrieved = registry.get('NonExistentComponent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for registered component', () => {
      const component = createSimpleComponent('TestComponent', { value: 0 });
      registry.register('TestComponent', component);

      expect(registry.has('TestComponent')).toBe(true);
    });

    it('should return false for non-registered component', () => {
      expect(registry.has('NonExistentComponent')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return empty map when no components registered', () => {
      const all = registry.getAll();
      expect(all.size).toBe(0);
    });

    it('should return all registered components', () => {
      const component1 = createSimpleComponent('Component1', { value: 0 });
      const component2 = createSimpleComponent('Component2', { value: 0 });

      registry.register('Component1', component1);
      registry.register('Component2', component2);

      const all = registry.getAll();
      expect(all.size).toBe(2);
      expect(all.get('Component1')).toBe(component1);
      expect(all.get('Component2')).toBe(component2);
    });

    it('should return a copy, not the original map', () => {
      const component = createSimpleComponent('TestComponent', { value: 0 });
      registry.register('TestComponent', component);

      const all = registry.getAll();
      all.set('NewComponent', component); // Попытка модифицировать

      expect(registry.has('NewComponent')).toBe(false);
      expect(registry.size()).toBe(1);
    });
  });

  describe('size', () => {
    it('should return 0 for empty registry', () => {
      expect(registry.size()).toBe(0);
    });

    it('should return correct size after registering components', () => {
      registry.register('Component1', createSimpleComponent('Component1', { value: 0 }));
      expect(registry.size()).toBe(1);

      registry.register('Component2', createSimpleComponent('Component2', { value: 0 }));
      expect(registry.size()).toBe(2);
    });
  });

  describe('clear', () => {
    it('should remove all registered components', () => {
      registry.register('Component1', createSimpleComponent('Component1', { value: 0 }));
      registry.register('Component2', createSimpleComponent('Component2', { value: 0 }));

      expect(registry.size()).toBe(2);

      registry.clear();

      expect(registry.size()).toBe(0);
      expect(registry.has('Component1')).toBe(false);
      expect(registry.has('Component2')).toBe(false);
    });
  });

  describe('isolation between tests', () => {
    it('should not be affected by other tests', () => {
      // Этот тест должен проходить независимо от других
      expect(registry.size()).toBe(0);
    });
  });
});
