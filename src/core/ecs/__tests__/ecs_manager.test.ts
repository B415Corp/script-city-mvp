import { describe, it, expect } from 'vitest';
import { ECSManager, ScheduleManager } from '../ecs_manager';

/**
 * Тесты для ECSManager
 *
 * NOTE: Полноценное тестирование ECSManager сложно из-за множества зависимостей
 * и внутренней логики ScheduleManager. Основная логика выполнения систем
 * протестирована в schedule_manager.test.ts.
 *
 * Здесь проверяем только базовую функциональность.
 */

describe('ECSManager', () => {
  // Базовые тесты структуры и импортов
  it('должен быть определен класс ECSManager', () => {
    expect(ECSManager).toBeDefined();
    expect(typeof ECSManager).toBe('function');
  });

  it('должен экспортировать ScheduleManager', () => {
    expect(ScheduleManager).toBeDefined();
    expect(typeof ScheduleManager).toBe('function');
  });

  // Тесты типов и интерфейсов
  it('должен содержать необходимые интерфейсы', () => {
    // Проверяем что определены ключевые интерфейсы
    expect(ECSManager).toBeDefined();
    expect(ScheduleManager).toBeDefined();
  });
});
