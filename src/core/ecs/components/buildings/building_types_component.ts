/**
 * Компоненты для разных типов зданий
 * Используются системами расписания для определения типа здания
 */

/**
 * Компонент магазина
 */
export const Shop = {
  type: [] as string[], // Тип магазина ('grocery', 'clothing', etc.)
  size: [] as string[], // Размер ('small', 'medium', 'large')
  demand: [] as number[], // Текущий спрос (0-100)
  stock: [] as number[], // Запасы (0-100)
} as const;

/**
 * Компонент фабрики (работы)
 */
export const Factory = {
  type: [] as string[], // Тип производства
  capacity: [] as number[], // Производственная мощность
  efficiency: [] as number[], // Эффективность (0-100)
  workers: [] as number[], // Количество рабочих
} as const;

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
