import { createSimpleComponent } from '@/core/ecs/core/component_schema';

/**
 * Потребности жителей
 * Определяют мотивацию поведения и уровень удовлетворенности
 */
export const Needs = createSimpleComponent('Needs', {
  /** Уровень голода (0-100, 100 = очень голоден) */
  food: 0,
  /** Потребность в покупках (0-100, 100 = нужны покупки) */
  shopping: 0,
  /** Потребность в работе (0-100, 100 = нужна работа) */
  work: 0,
  /** Потребность во сне (0-100, 100 = очень хочет спать) */
  sleep: 0,
});

/**
 * Тип для данных потребностей
 */
export type NeedsData = {
  food: number;
  shopping: number;
  work: number;
  sleep: number;
};

/**
 * Уровни потребностей
 */
export enum NeedLevel {
  SATISFIED = 0, // Удовлетворена
  LOW = 25, // Низкая
  MEDIUM = 50, // Средняя
  HIGH = 75, // Высокая
  CRITICAL = 90, // Критическая
}
