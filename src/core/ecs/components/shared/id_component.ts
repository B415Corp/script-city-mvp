/**
 * Уникальный идентификатор сущности
 * Используется для связи с внешними системами и отладки
 */
export const ID = {
  /** Уникальный числовой ID */
  value: [] as number[]
} as const;

/**
 * Тип для ID данных
 */
export type IdData = {
  value: number;
};
