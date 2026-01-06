/**
 * Данные для рендеринга сущности
 * Используется для отображения объектов на карте
 */
export const Render = {
  /** Видимость объекта (0 = скрыт, 1 = виден) */
  visible: [] as number[],
  /** Z-index для слоев отображения */
  layer: [] as number[],
  /** Тип спрайта или текстуры */
  spriteType: [] as string[],
  /** Цвет/тема для отображения */
  color: [] as string[],
} as const;

/**
 * Типы слоев отображения
 */
export enum RenderLayer {
  BACKGROUND = 0,
  TERRAIN = 1,
  BUILDINGS = 2,
  UNITS = 3,
  EFFECTS = 4,
  UI = 5,
}

/**
 * Типы спрайтов
 */
export enum SpriteType {
  PERSON = 'person',
  HOUSE = 'house',
  SHOP = 'shop',
  OFFICE = 'office',
  CAR = 'car',
}

/**
 * Тип для данных рендеринга
 */
export type RenderData = {
  visible: number;
  layer: RenderLayer;
  spriteType: SpriteType | string;
  color: string;
};
