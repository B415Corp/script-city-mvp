import { EntityId } from 'bitecs';

/**
 * Товары и ресурсы
 * Определяет характеристики товаров в экономике
 */
export const Goods = {
  /** Тип товара */
  type: [] as string[],
  /** Количество */
  quantity: [] as number[],
  /** Цена за единицу */
  price: [] as number[],
  /** Производитель товара */
  producer: [] as EntityId[]
} as const;

/**
 * Типы товаров
 */
export enum GoodsType {
  FOOD = 'food',        // Еда
  CLOTHES = 'clothes',  // Одежда
  ELECTRONICS = 'electronics', // Электроника
  HOUSEHOLD = 'household' // Хозяйственные товары
}

/**
 * Тип для данных товара
 */
export type GoodsData = {
  type: string;
  quantity: number;
  price: number;
  producer: EntityId;
};
