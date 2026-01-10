import { createSimpleComponent } from '@/core/ecs/core/component_schema';

/**
 * Компоненты для разных типов зданий
 */

/**
 * Компонент магазина
 */
export const Shop = createSimpleComponent('Shop', {
  /** Тип магазина (индекс) */
  type: 0,
  /** Размер (индекс) */
  size: 0,
  /** Текущий спрос (0-100%) */
  demand: 50,
  /** Запасы (0-100%) */
  stock: 100,
  /** Цена товаров */
  price: 10.0,
});

/**
 * Компонент фабрики (работы)
 */
export const Factory = createSimpleComponent('Factory', {
  /** Тип производства (индекс) */
  type: 0,
  /** Производственная мощность */
  capacity: 100,
  /** Эффективность (0-100%) */
  efficiency: 80,
  /** Количество рабочих */
  workers: 0,
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
