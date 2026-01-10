import { defineComponent } from '@/core/ecs/core/component_builder';

/**
 * Позиция сущности в мире
 * Используется для всех движущихся объектов и зданий
 */
export const Position = defineComponent('Position', {
  /** Координата X */
  x: { type: 'f32', default: 0 },
  /** Координата Y */
  y: { type: 'f32', default: 0 },
  /** Координата Z (для будущих 3D возможностей) */
  z: { type: 'f32', default: 0 },
});

/**
 * Тип для позиционных данных
 */
export type PositionData = {
  x: number;
  y: number;
};
