/**
 * Глобальные цены в городе
 * Определяет текущие рыночные цены на товары и услуги
 */
export const Prices = {
  /** Цена аренды жилья (базовая месячная ставка) */
  rentPrice: [] as number[],
  /** Цена продуктов питания (базовая месячная стоимость) */
  foodPrice: [] as number[],
  /** Дата последнего обновления цен */
  lastUpdateDay: [] as number[],
} as const;

/**
 * Тип для данных о ценах
 */
export type PricesData = {
  rentPrice: number;
  foodPrice: number;
  lastUpdateDay: number;
};
