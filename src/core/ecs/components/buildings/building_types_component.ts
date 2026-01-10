import { defineComponent } from '@/core/ecs/core/component_builder';

/**
 * Компоненты для разных типов зданий
 */

/**
 * Компонент магазина
 */
export const Shop = defineComponent('Shop', {
  /** Тип магазина (индекс) */
  type: { type: 'ui8', default: 0 },
  /** Размер (индекс) */
  size: { type: 'ui8', default: 0 },
  /** Текущий спрос (0-100) */
  demand: { type: 'ui8', default: 50, min: 0, max: 100 },
  /** Запасы (0-100) */
  stock: { type: 'ui8', default: 100, min: 0, max: 100 },
  /** Цена товаров */
  price: { type: 'f32', default: 10, min: 0 },
});

/**
 * Компонент фабрики (работы)
 */
export const Factory = defineComponent('Factory', {
  /** Тип производства (индекс) */
  type: { type: 'ui8', default: 0 },
  /** Производственная мощность */
  capacity: { type: 'ui16', default: 100, min: 0 },
  /** Эффективность (0-100) */
  efficiency: { type: 'ui8', default: 80, min: 0, max: 100 },
  /** Количество рабочих */
  workers: { type: 'ui16', default: 0, min: 0 },
});

/**
 * Типы зданий
 */
export type BuildingType = 'shop' | 'factory';

/**
 * Типы для данных зданий
 */
export type ShopData = {
  type: string;
  size: string;
  demand: number;
  stock: number;
};

export type FactoryData = {
  type: string;
  capacity: number;
  efficiency: number;
  workers: number;
};
