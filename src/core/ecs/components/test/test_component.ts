import { createComponent } from '../../core/smart_constructors';

/**
 * Тестовый компонент для проверки работы автоматической регистрации
 * Создан с использованием createComponent() в Phase 1
 */
export const TestComponent = createComponent('TestComponent', {
  value: 0,
  nameId: 0, // Используем number вместо string (индекс в массиве строк)
  enabled: 1, // 1 = true, 0 = false
});

/**
 * Другой тестовый компонент
 */
export const AnotherTestComponent = createComponent('AnotherTestComponent', {
  x: 0,
  y: 0,
  velocity: 0,
});
