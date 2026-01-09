import { EntityId } from 'bitecs';

/**
 * Тип собственности жилья
 */
export enum HousingType {
  OWNED = 0, // Собственное
  RENTED = 1, // Арендное
}

/**
 * Гражданин города
 * Содержит социальные и экономические характеристики
 */
export const Citizen = {
  /** Уровень счастья (0-100) */
  happiness: [] as number[],
  /** Дом, где живет гражданин */
  home: [] as EntityId[],
  /** Место работы (может быть undefined) */
  workplace: [] as (EntityId | undefined)[],
  /** Количество денег */
  money: [] as number[],
  /** Уровень энергии/усталости (0-100) */
  energy: [] as number[],
  /** Тип собственности жилья */
  housingType: [] as number[],
  /** Минимальные месячные расходы (аренда + еда) */
  minimumExpenses: [] as number[],
  /** Зарплата за последний месяц */
  salary: [] as number[],
  /** Ищет ли работу в данный момент */
  isLookingForJob: [] as boolean[],
  /** Количество попыток поиска работы с момента последней работы */
  jobSearchAttempts: [] as number[],
  /** День последней попытки поиска работы */
  lastJobSearchDay: [] as number[],
  /** День последнего списания месячных расходов */
  lastExpenseDay: [] as number[],
  /** День последнего получения зарплаты */
  lastWorkDay: [] as number[],
} as const;

/**
 * Тип для данных гражданина
 */
export type CitizenData = {
  happiness: number;
  home: EntityId;
  workplace?: EntityId;
  money: number;
  energy: number;
  housingType: HousingType;
  minimumExpenses: number;
  salary: number;
  isLookingForJob: boolean;
  jobSearchAttempts: number;
  lastJobSearchDay: number;
  lastExpenseDay: number;
};
