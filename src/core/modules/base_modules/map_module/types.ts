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
