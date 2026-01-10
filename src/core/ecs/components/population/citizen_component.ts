import { createSimpleComponent } from '@/core/ecs/core/component_schema';

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
export const Citizen = createSimpleComponent('Citizen', {
  /** Уровень счастья (0-100) */
  happiness: 70,
  /** Дом, где живет гражданин */
  home: 0,
  /** Место работы */
  workplace: 0,
  /** Количество денег */
  money: 100.0,
  /** Уровень энергии/усталости (0-100) */
  energy: 100,
  /** Тип собственности жилья */
  housingType: 0,
  /** Минимальные месячные расходы (аренда + еда) */
  minimumExpenses: 50.0,
  /** Зарплата за последний месяц */
  salary: 50.0,
  /** День последнего получения зарплаты */
  lastWorkDay: 0,
  /** Ищет ли работу в данный момент (boolean as 0/1) */
  isLookingForJob: 0,
  /** Количество попыток поиска работы с момента последней работы */
  jobSearchAttempts: 0,
  /** День последней попытки поиска работы */
  lastJobSearchDay: 0,
  /** День последнего списания месячных расходов */
  lastExpenseDay: 0,
  /** Живет ли бездомным (boolean as 0/1) */
  isHomeless: 1,
  /** Возраст гражданина */
  age: 25,
  /** Уровень образования (1-5) */
  education: 0,
  /** Опыт работы */
  experience: 0,
  /** Навыки (bitfield) */
  skills: 0,
});

/**
 * Тип для данных гражданина
 */
export type CitizenData = {
  happiness: number;
  home: number;
  workplace: number;
  money: number;
  energy: number;
  housingType: number;
  minimumExpenses: number;
  salary: number;
  lastWorkDay: number;
  isLookingForJob: number;
  jobSearchAttempts: number;
  lastJobSearchDay: number;
  lastExpenseDay: number;
  isHomeless: number;
  age: number;
  education: number;
  experience: number;
  skills: number;
};
