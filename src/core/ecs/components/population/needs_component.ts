import { defineComponent } from '@/core/ecs/core/component_builder';

/**
 * Потребности жителей
 * Определяют мотивацию поведения и уровень удовлетворенности
 */
export const Needs = defineComponent('Needs', {
  /** Уровень голода (0-100, 100 = очень голоден) */
  food: { type: 'ui8', default: 0, min: 0, max: 100 },
  /** Потребность в покупках (0-100, 100 = нужны покупки) */
  shopping: { type: 'ui8', default: 0, min: 0, max: 100 },
  /** Потребность в работе (0-100, 100 = нужна работа) */
  work: { type: 'ui8', default: 0, min: 0, max: 100 },
  /** Потребность во сне (0-100, 100 = очень хочет спать) */
  sleep: { type: 'ui8', default: 0, min: 0, max: 100 },
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
