import { EntityId } from 'bitecs';

/**
 * Коммерческое здание
 * Магазины, офисы, производства
 */
export const Commercial = {
  /** Тип здания */
  type: [] as number[],
  /** Инвентарь товаров (название -> количество) */
  inventory: [] as Record<string, number>[],
  /** Сотрудники */
  employees: [] as EntityId[][],
  /** Текущие покупатели/клиенты */
  customers: [] as EntityId[][],
} as const;

/**
 * Типы коммерческих зданий
 */
export enum CommercialType {
  SHOP = 0, // Магазин
  OFFICE = 1, // Офис
  FACTORY = 2, // Завод
}

/**
 * Тип для данных коммерческого здания
 */
export type CommercialData = {
  type: CommercialType;
  inventory: Record<string, number>;
  employees: EntityId[];
  customers: EntityId[];
};
