import { createSimpleComponent } from '@/core/ecs/core/component_schema';

/**
 * Позиция сущности в мире
 * Используется для всех движущихся объектов и зданий
 */
export const Position = createSimpleComponent('Position', {
  /** Координата X */
  x: 0.0001, // Используем нецелое значение для указания float типа
  /** Координата Y */
  y: 0.0001, // Используем нецелое значение для указания float типа
  /** Координата Z (для будущих 3D возможностей) */
  z: 0.0001, // Используем нецелое значение для указания float типа
});

/**
 * Тип для позиционных данных
 */
export type PositionData = {
  x: number;
  y: number;
};
