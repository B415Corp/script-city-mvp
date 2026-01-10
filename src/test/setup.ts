import { beforeEach, afterEach } from 'vitest';
import { ComponentRegistry } from '../core/ecs/registry/component_registry';

// Глобальный mock для Phaser
(globalThis as any).Phaser = {
  Scene: class MockScene {},
  GameObjects: {
    Container: class MockContainer {
      setDepth() { return this; }
    },
  },
};

/**
 * Очищает все массивы компонентов между тестами
 * Это предотвращает загрязнение состояния между тестами
 */
function resetComponentArrays(): void {
  const registry = ComponentRegistry.getInstance();
  const components = registry.getAll();

  // Очищаем массивы всех зарегистрированных компонентов
  for (const [name, component] of components) {
    // Очистить все массивы в компоненте
    for (const key in component) {
      const value = component[key];
      if (Array.isArray(value)) {
        // Очищаем массив, устанавливая его длину в 0
        (value as any[]).length = 0;
      }
    }
  }
}

beforeEach(() => {
  resetComponentArrays();
});

afterEach(() => {
  resetComponentArrays();
});
