import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentRegistry } from '../component_registry';
import { createSimpleComponent } from '../../core/component_schema';

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry;

  beforeEach(() => {
    // Получаем экземпляр реестра и очищаем его перед каждым тестом
    registry = ComponentRegistry.getInstance();
    registry.clear();
  });

  describe('Singleton pattern', () => {
    it('должен возвращать один и тот же экземпляр', () => {
      const instance1 = ComponentRegistry.getInstance();
      const instance2 = ComponentRegistry.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(registry);
    });
  });

  describe('register', () => {
    it('должен успешно регистрировать компонент', () => {
      const component = createSimpleComponent('TestComponent', { value: 0 });

      registry.register('TestComponent', component);

      expect(registry.has('TestComponent')).toBe(true);
      expect(registry.get('TestComponent')).toBe(component);
    });

    it('должен выбрасывать ошибку при повторной регистрации компонента', () => {
      const component1 = createSimpleComponent('TestComponent', { value: 0 });
      const component2 = createSimpleComponent('TestComponent2', { value: 0 });

      registry.register('TestComponent', component1);

      expect(() => registry.register('TestComponent', component2)).toThrow(
        'Component "TestComponent" is already registered',
      );
    });

    it('должен позволять регистрировать компоненты с разными именами', () => {
      const component1 = createSimpleComponent('Component1', { value: 0 });
      const component2 = createSimpleComponent('Component2', { value: 0 });

      registry.register('Component1', component1);
      registry.register('Component2', component2);

      expect(registry.has('Component1')).toBe(true);
      expect(registry.has('Component2')).toBe(true);
      expect(registry.size()).toBe(2);
    });
  });

  describe('get', () => {
    it('должен возвращать зарегистрированный компонент', () => {
      const component = createSimpleComponent('TestComponent', { value: 42 });
      registry.register('TestComponent', component);

      const retrieved = registry.get('TestComponent');

      expect(retrieved).toBe(component);
    });

    it('должен возвращать undefined для незарегистрированного компонента', () => {
      const retrieved = registry.get('NonExistentComponent');

      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('должен возвращать все зарегистрированные компоненты', () => {
      const component1 = createSimpleComponent('Component1', { value: 1 });
      const component2 = createSimpleComponent('Component2', { value: 2 });

      registry.register('Component1', component1);
      registry.register('Component2', component2);

      const all = registry.getAll();

      expect(all).toBeInstanceOf(Map);
      expect(all.size).toBe(2);
      expect(all.get('Component1')).toBe(component1);
      expect(all.get('Component2')).toBe(component2);
    });

    it('должен возвращать пустую Map если нет зарегистрированных компонентов', () => {
      const all = registry.getAll();

      expect(all).toBeInstanceOf(Map);
      expect(all.size).toBe(0);
    });

    it('должен возвращать копию Map, а не оригинал', () => {
      const component = createSimpleComponent('TestComponent', { value: 0 });
      registry.register('TestComponent', component);

      const all = registry.getAll();

      // Изменение возвращенной Map не должно влиять на оригинал
      all.set('NewComponent', component);
      expect(registry.has('NewComponent')).toBe(false);
      expect(registry.size()).toBe(1);
    });
  });

  describe('has', () => {
    it('должен возвращать true для зарегистрированного компонента', () => {
      const component = createSimpleComponent('TestComponent', { value: 0 });
      registry.register('TestComponent', component);

      expect(registry.has('TestComponent')).toBe(true);
    });

    it('должен возвращать false для незарегистрированного компонента', () => {
      expect(registry.has('NonExistentComponent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('должен очищать все зарегистрированные компоненты', () => {
      const component1 = createSimpleComponent('Component1', { value: 1 });
      const component2 = createSimpleComponent('Component2', { value: 2 });

      registry.register('Component1', component1);
      registry.register('Component2', component2);

      expect(registry.size()).toBe(2);

      registry.clear();

      expect(registry.size()).toBe(0);
      expect(registry.has('Component1')).toBe(false);
      expect(registry.has('Component2')).toBe(false);
    });
  });

  describe('size', () => {
    it('должен возвращать правильное количество зарегистрированных компонентов', () => {
      expect(registry.size()).toBe(0);

      const component1 = createSimpleComponent('Component1', { value: 1 });
      registry.register('Component1', component1);
      expect(registry.size()).toBe(1);

      const component2 = createSimpleComponent('Component2', { value: 2 });
      registry.register('Component2', component2);
      expect(registry.size()).toBe(2);
    });
  });
});
