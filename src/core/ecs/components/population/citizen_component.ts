import { EntityId } from 'bitecs';

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
  energy: [] as number[]
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
};
