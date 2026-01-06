/**
 * Потребности жителей
 * Определяют мотивацию поведения и уровень удовлетворенности
 */
export const Needs = {
  /** Уровень голода (0-100, 100 = очень голоден) */
  food: [] as number[],
  /** Потребность в покупках (0-100, 100 = нужны покупки) */
  shopping: [] as number[],
  /** Потребность в работе (0-100, 100 = нужна работа) */
  work: [] as number[],
  /** Потребность во сне (0-100, 100 = очень хочет спать) */
  sleep: [] as number[],
} as const;

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
