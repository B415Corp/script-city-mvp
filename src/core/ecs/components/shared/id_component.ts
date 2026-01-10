import { createSimpleComponent } from '@/core/ecs/core/component_schema';

/**
 * Уникальный идентификатор сущности
 * Используется для связи с внешними системами и отладки
 */
export const ID = createSimpleComponent('ID', {
  /** Уникальный числовой ID */
  value: 0,
});

/**
 * Тип для ID данных
 */
export type IdData = {
  value: number;
};
