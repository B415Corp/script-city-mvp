import { defineComponent } from '@/core/ecs/core/component_builder';

/**
 * Уникальный идентификатор сущности
 * Используется для связи с внешними системами и отладки
 */
export const ID = defineComponent('ID', {
  /** Уникальный числовой ID */
  value: { type: 'ui32', default: 0 },
});

/**
 * Тип для ID данных
 */
export type IdData = {
  value: number;
};
