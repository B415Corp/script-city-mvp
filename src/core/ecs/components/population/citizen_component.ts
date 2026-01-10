import { defineComponent } from '@/core/ecs/core/component_builder';

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
export const Citizen = defineComponent('Citizen', {
  /** Уровень счастья (0-100) */
  happiness: { type: 'ui8', default: 70, min: 0, max: 100 },
  /** Дом, где живет гражданин */
  home: { type: 'ui32', default: 0 },
  /** Место работы */
  workplace: { type: 'ui32', default: 0 },
  /** Количество денег */
  money: { type: 'f32', default: 100, min: 0 },
  /** Уровень энергии/усталости (0-100) */
  energy: { type: 'ui8', default: 100, min: 0, max: 100 },
  /** Тип собственности жилья */
  housingType: { type: 'ui8', default: 0 },
  /** Минимальные месячные расходы (аренда + еда) */
  minimumExpenses: { type: 'f32', default: 50, min: 0 },
  /** Зарплата за последний месяц */
  salary: { type: 'f32', default: 50, min: 0 },
  /** День последнего получения зарплаты */
  lastWorkDay: { type: 'ui32', default: 0 },
  /** Ищет ли работу в данный момент (boolean as 0/1) */
  isLookingForJob: { type: 'ui8', default: 0 },
  /** Количество попыток поиска работы с момента последней работы */
  jobSearchAttempts: { type: 'ui16', default: 0, min: 0 },
  /** День последней попытки поиска работы */
  lastJobSearchDay: { type: 'ui32', default: 0 },
  /** День последнего списания месячных расходов */
  lastExpenseDay: { type: 'ui32', default: 0 },
  /** Живет ли бездомным (boolean as 0/1) */
  isHomeless: { type: 'ui8', default: 1 },
  /** Возраст гражданина */
  age: { type: 'ui8', default: 25, min: 0, max: 120 },
  /** Уровень образования (1-5) */
  education: { type: 'ui8', default: 0, min: 0, max: 5 },
  /** Опыт работы */
  experience: { type: 'ui16', default: 0, min: 0 },
  /** Навыки (bitfield) */
  skills: { type: 'ui32', default: 0 },
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
