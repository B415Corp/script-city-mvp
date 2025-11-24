/**
 * Утилита для работы с изометрической проекцией.
 *
 * **Теги**: `arch:infrastructure`, `map:isometric`
 *
 * Конвертирует координаты между тайловой сеткой и экранными координатами
 * с учётом изометрической проекции.
 */
export class IsometricMath {
  /**
   * Размер тайла в пикселях (ширина и высота ромба)
   */
  private readonly tileWidth: number;
  private readonly tileHeight: number;

  /**
   * Смещение для центрирования сетки
   */
  private cameraOffsetX: number = 0;
  private cameraOffsetY: number = 0;

  constructor(tileWidth: number = 64, tileHeight: number = 32) {
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
  }

  /**
   * Установка смещения камеры/сетки
   */
  setOffset(x: number, y: number): void {
    this.cameraOffsetX = x;
    this.cameraOffsetY = y;
  }

  /**
   * Конвертация координат тайла в экранные координаты (изометрическая проекция).
   *
   * @param tileX - координата X тайла
   * @param tileY - координата Y тайла
   * @returns экранные координаты { x, y }
   */
  tileToScreen(tileX: number, tileY: number): { x: number; y: number } {
    const x = (tileX - tileY) * (this.tileWidth / 2) + this.cameraOffsetX;
    const y = (tileX + tileY) * (this.tileHeight / 2) + this.cameraOffsetY;
    return { x, y };
  }

  /**
   * Конвертация экранных координат в координаты тайла.
   *
   * @param screenX - экранная координата X
   * @param screenY - экранная координата Y
   * @returns координаты тайла { tileX, tileY }
   */
  screenToTile(screenX: number, screenY: number): { tileX: number; tileY: number } {
    const relativeX = screenX - this.cameraOffsetX;
    const relativeY = screenY - this.cameraOffsetY;

    const tileX = Math.floor(
      (relativeX / (this.tileWidth / 2) + relativeY / (this.tileHeight / 2)) / 2,
    );
    const tileY = Math.floor(
      (relativeY / (this.tileHeight / 2) - relativeX / (this.tileWidth / 2)) / 2,
    );

    return { tileX, tileY };
  }

  /**
   * Получение размеров тайла
   */
  getTileSize(): { width: number; height: number } {
    return { width: this.tileWidth, height: this.tileHeight };
  }
}
