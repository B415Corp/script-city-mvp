import { defineComponent } from '@/core/ecs/core/component_builder';

/**
 * Коммерческое здание
 * Магазины, офисы, производства
 */
export const Commercial = defineComponent('Commercial', {
  /** Тип здания */
  type: { type: 'ui8', default: 0 },
  /** ID здания */
  buildingId: { type: 'ui32', default: 0 },
  /** Количество товаров в инвентаре */
  inventorySize: { type: 'ui16', default: 0 },
  /** Количество сотрудников */
  employeeCount: { type: 'ui16', default: 0 },
  /** Количество клиентов */
  customerCount: { type: 'ui16', default: 0 },
  /** Доход за день */
  dailyRevenue: { type: 'f32', default: 0 },
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
