/**
 * Позиция сущности в мире
 * Используется для всех движущихся объектов и зданий
 * В bitECS 0.4 компоненты - это обычные объекты с массивами
 */
export const Position = {
  /** Координата X */
  x: [] as number[],
  /** Координата Y */
  y: [] as number[],
} as const;

/**
 * Тип для позиционных данных
 */
export type PositionData = {
  x: number;
  y: number;
};
