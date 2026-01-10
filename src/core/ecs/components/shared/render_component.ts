import { createSimpleComponent } from '@/core/ecs/core/component_schema';

/**
 * Данные для рендеринга сущности
 * Используется для отображения объектов на карте
 */
export const Render = createSimpleComponent('Render', {
  /** Видимость объекта (0 = скрыт, 1 = виден) */
  visible: 1,
  /** Z-index для слоев отображения */
  layer: 1,
  /** Тип спрайта или текстуры (индекс) */
  spriteType: 0,
  /** Цвет/тема для отображения (индекс) */
  color: 0,
});

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
  layer: number;
  spriteType: number; // индекс спрайта
  color: number; // индекс цвета
};
