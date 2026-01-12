// Интерфейс для информации о тайле
export interface TileInfo {
  x: number;
  y: number;
  type: number;
  typeName: string;
}

// Интерфейс для координат тайла
export interface TileCoordinates {
  tileX: number;
  tileY: number;
}

/**
 * Данные события TileHovered
 * Содержит информацию о тайле под курсором
 */
export interface TileHoveredPayload extends TileCoordinates {
  /** Тип тайла (опционально) */
  tileType?: number;
  /** Название типа тайла (опционально) */
  tileTypeName?: string;
}

/**
 * Данные события TileClicked/TileClickedUp
 * Содержит координаты кликнутого тайла
 */
export interface TileClickedPayload extends TileCoordinates {}

/**
 * Данные события TilesSelected
 * Содержит информацию о выделенной области тайлов
 */
export interface TilesSelectedPayload {
  /** Начальные координаты выделения */
  start: { x: number; y: number };
  /** Конечные координаты выделения */
  end: { x: number; y: number };
  /** Ширина выделения в тайлах */
  width: number;
  /** Высота выделения в тайлах */
  height: number;
  /** Общее количество выделенных тайлов */
  count: number;
}

/**
 * Данные события CameraZoomed
 * Содержит информацию об изменении масштаба камеры
 */
export interface CameraZoomedPayload {
  /** Новый масштаб камеры */
  scale: number;
  /** X координата камеры */
  x: number;
  /** Y координата камеры */
  y: number;
}

/**
 * Данные события MapCentered
 * Содержит координаты центра карты
 */
export interface MapCenteredPayload {
  /** X координата центра */
  x: number;
  /** Y координата центра */
  y: number;
}
