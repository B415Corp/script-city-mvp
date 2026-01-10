import { createSystem } from '../../core/smart_constructors';

/**
 * Тестовая система для проверки работы автоматической регистрации
 * Создан с использованием createSystem() в Phase 1
 */
export const TestSystem = createSystem(
  'test',
  ['TestComponent'],
  (world, entities, delta) => {
    // Простая логика для тестирования
    console.log(`TestSystem update: ${entities.length} entities, delta: ${delta}`);
  },
  {
    cluster: 'test', // Автоматически добавляется в кластер
    interval: undefined, // Каждый тик (по умолчанию)
    eventTriggers: ['test:event'], // Реагирует на события
    enabled: true,
  },
);

/**
 * Другая тестовая система с интервалом
 */
export const IntervalTestSystem = createSystem(
  'interval_test',
  ['AnotherTestComponent'],
  (world, entities, delta) => {
    console.log(`IntervalTestSystem update: ${delta}ms passed, time: ${Date.now()}`);
  },
  {
    cluster: 'test',
    interval: 2000, // Каждые 2000 мс (2 секунды)
    enabled: true,
  },
);

/**
 * Тестовая event-driven система
 */
export const EventTestSystem = createSystem(
  'event_test',
  ['TestComponent'],
  (world, entities, delta) => {
    console.log(`EventTestSystem triggered: entities=${entities.length}, time: ${Date.now()}`);
  },
  {
    cluster: 'test',
    eventTriggers: ['test:event', 'custom:action'], // Реагирует на эти события
    enabled: true,
  },
);
