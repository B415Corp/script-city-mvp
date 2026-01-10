import { createSimpleComponent } from '@/core/ecs/core/component_schema';

/**
 * Коммерческое здание
 * Магазины, офисы, производства
 */
export const Commercial = createSimpleComponent('Commercial', {
  /** Тип здания */
  type: 0,
  /** ID здания */
  buildingId: 0,
  /** Количество товаров в инвентаре */
  inventorySize: 0,
  /** Количество сотрудников */
  employeeCount: 0,
  /** Количество клиентов */
  customerCount: 0,
  /** Доход за день */
  dailyRevenue: 0.0,
});

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
  buildingId: number;
  inventorySize: number;
  employeeCount: number;
  customerCount: number;
  dailyRevenue: number;
};
