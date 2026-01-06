import { EntityId } from 'bitecs';

/**
 * Жилое здание (дом)
 * Предоставляет жилье для граждан
 */
export const Residential = {
  /** Максимальная вместимость (количество жителей) */
  capacity: [] as number[],
  /** Текущие жители (массив EntityId) */
  occupants: [] as EntityId[][],
  /** Качество жилья (0-100, влияет на счастье жителей) */
  quality: [] as number[],
} as const;

/**
 * Тип для данных жилого здания
 */
export type ResidentialData = {
  capacity: number;
  occupants: EntityId[];
  quality: number;
};
