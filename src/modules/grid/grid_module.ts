import { GameCore } from '@/core/game_core/game_core';
import { IModule } from '@/core/module_manager/types';
import { UIComponent } from '@/core/ui/ui_component';
import { EventBus } from '@/core/event_bus/event_bus';
import { Events } from '@/core/event_bus/events';
import { IsometricMath } from '@/infrastructure/isometric_math/isometric_math';
import Phaser from 'phaser';
import { DEFAULT_MAP } from './default_map';

const TextureType: Record<number, string> = {
  1: 'GRASS_BASE_0',
  2: 'SAND_BASE_0',
  3: 'SNOW_BASE_0',
  4: 'FOREST_BASE_0',
  5: 'MOUNTAIN_BASE_0',
  // 6: 'ROAD_STRAIGHT_0',
  // 7: 'ROAD_CROSSROADS_0',
  // 8: 'RESIDENTIAL_ZONE_0',
  // 9: 'COMMERCIAL_ZONE_0',
  // 10: 'INDUSTRIAL_ZONE_0',
  // 11: 'POWER_PLANT_0',
  // 12: 'POLICE_STATION_0',
  // 13: 'HOSPITAL_0',
  // 14: 'PARK_0',
};

/**
 * Модуль отрисовки изометрической сетки с текстурными тайлами.
 */
export class GridModule implements IModule {
  id = 'grid';
  dependencies?: string[];

  private scene?: Phaser.Scene;
  private isometricMath?: IsometricMath;
  private eventBus?: EventBus;

  private container?: Phaser.GameObjects.Container;
  private highlightGraphics?: Phaser.GameObjects.Graphics;

  // Параметры сетки
  private readonly gridWidth: number = 100;
  private readonly gridHeight: number = 100;
  private readonly tileWidth: number = 128;
  private readonly tileHeight: number = 64;

  // Управление камерой
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;

  // Текущий подсвеченный тайл
  private highlightedTile: { x: number; y: number } | null = null;

  async initialize(core: GameCore): Promise<void> {
    this.eventBus = core.getEventBus();
    this.isometricMath = new IsometricMath(this.tileWidth, this.tileHeight);
    console.warn('🗺 GridModule initialized');
  }

  attachToScene(scene: Phaser.Scene): void {
    this.scene = scene;

    if (!this.isometricMath) {
      throw new Error('GridModule not initialized');
    }

    // Контейнер карты
    this.container = scene.add.container(0, 0).setDepth(0);

    // Graphics только под подсветку!
    this.highlightGraphics = scene.add.graphics();
    this.container.add(this.highlightGraphics);

    this.centerMap();
    this.drawGrid();
    this.setupCameraControls();

    scene.input.on('pointermove', this.handlePointerMove, this);
    scene.input.on('pointerout', this.clearHighlight, this);
    scene.input.on('pointerdown', this.handlePointerDown, this);

    console.warn('🗺 GridModule attached to scene');
  }

  /** Центрирование карты */
  private centerMap(): void {
    if (!this.scene || !this.container) return;

    const camera = this.scene.cameras.main;
    const cx = camera.width / 2;
    const cy = camera.height / 2;

    this.container.setPosition(cx, cy);
    this.isometricMath?.setOffset(0, 0);

    // Эмитим событие центрирования карты
    this.eventBus?.emit(Events.MapCentered, {
      x: cx,
      y: cy,
    });
  }

  /** Основная отрисовка сетки — теперь плитки рендерятся как Image */
  private drawGrid(): void {
    if (!this.scene || !this.container || !this.isometricMath) return;

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.drawTileTexture(x, y, DEFAULT_MAP.tiles[y][x]);
      }
    }
  }

  /** Отрисовка плитки текстурой */
  private drawTileTexture(tileX: number, tileY: number, tileType: number): void {
    if (!this.scene || !this.container || !this.isometricMath) return;

    const center = this.isometricMath.tileToScreen(tileX, tileY);

    const img = this.scene.add.image(center.x, center.y, TextureType[tileType]);

    // Центрирование в изометрии
    img.setOrigin(0.5, 0.5);

    // Масштаб текстуры под размер ромба
    img.setDisplaySize(this.tileWidth, this.tileHeight);

    this.container.add(img);
  }

  /** Подсветка */
  private drawHighlight(tileX: number, tileY: number): void {
    if (!this.highlightGraphics || !this.isometricMath) return;

    this.highlightGraphics.clear();

    const center = this.isometricMath.tileToScreen(tileX, tileY);
    const hw = this.tileWidth / 2;
    const hh = this.tileHeight / 2;

    this.highlightGraphics.fillStyle(0xffffff, 1);
    this.highlightGraphics.lineStyle(2, 0xffffff, 1);

    // Фигура ромба
    this.highlightGraphics.beginPath();
    this.highlightGraphics.moveTo(center.x, center.y - hh);
    this.highlightGraphics.lineTo(center.x + hw, center.y);
    this.highlightGraphics.lineTo(center.x, center.y + hh);
    this.highlightGraphics.lineTo(center.x - hw, center.y);
    this.highlightGraphics.closePath();

    this.highlightGraphics.fillPath();
    this.highlightGraphics.strokePath();
  }

  /** Очистка подсветки */
  private clearHighlight(): void {
    if (this.highlightedTile) {
      // Эмитим событие ухода с тайла
      this.eventBus?.emit(Events.TileUnhovered, {
        tileX: this.highlightedTile.x,
        tileY: this.highlightedTile.y,
      });
    }
    this.highlightGraphics?.clear();
    this.highlightedTile = null;
  }

  /** Обработка клика по тайлу */
  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.isDragging) return;
    if (!this.scene || !this.container || !this.isometricMath) return;

    // Проверка попадания над UI
    const hasUI = this.scene.children.list.some((child) => {
      const obj = child as Phaser.GameObjects.GameObject & { depth?: number };
      if (obj.depth !== undefined && obj.depth >= UIComponent.DEPTH.UI_BASE) {
        if (child instanceof Phaser.GameObjects.Container) {
          return child.getBounds().contains(pointer.x, pointer.y);
        }
      }
      return false;
    });

    if (hasUI) {
      return;
    }

    // Обрабатываем только левый клик
    if (!pointer.leftButtonDown()) {
      return;
    }

    // Преобразуем координаты мыши в координаты относительно контейнера с учетом масштаба
    const containerX = (pointer.x - this.container.x) / this.container.scale;
    const containerY = (pointer.y - this.container.y) / this.container.scale;

    // Получаем приблизительный тайл
    const approximateTile = this.isometricMath.screenToTile(containerX, containerY);

    // Проверяем точное попадание в тайл
    const tile = this.findTileAtPoint(
      containerX,
      containerY,
      approximateTile.tileX,
      approximateTile.tileY,
    );

    if (
      tile &&
      tile.tileX >= 0 &&
      tile.tileX < this.gridWidth &&
      tile.tileY >= 0 &&
      tile.tileY < this.gridHeight
    ) {
      // Эмитим событие клика по тайлу
      this.eventBus?.emit(Events.TileClicked, {
        tileX: tile.tileX,
        tileY: tile.tileY,
      });
    }
  }

  /** Реакция на передвижение мыши */
  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.isDragging) return;
    if (!this.scene || !this.container || !this.isometricMath) return;

    // Проверка попадания над UI
    const hasUI = this.scene.children.list.some((child) => {
      const obj = child as Phaser.GameObjects.GameObject & { depth?: number };
      if (obj.depth !== undefined && obj.depth >= UIComponent.DEPTH.UI_BASE) {
        if (child instanceof Phaser.GameObjects.Container) {
          return child.getBounds().contains(pointer.x, pointer.y);
        }
      }
      return false;
    });

    if (hasUI) {
      this.clearHighlight();
      return;
    }

    // Преобразуем координаты мыши в координаты относительно контейнера с учетом масштаба
    const containerX = (pointer.x - this.container.x) / this.container.scale;
    const containerY = (pointer.y - this.container.y) / this.container.scale;

    // Получаем приблизительный тайл
    const approximateTile = this.isometricMath.screenToTile(containerX, containerY);

    // Проверяем точное попадание в тайл и соседние тайлы
    const tile = this.findTileAtPoint(
      containerX,
      containerY,
      approximateTile.tileX,
      approximateTile.tileY,
    );

    if (
      tile &&
      tile.tileX >= 0 &&
      tile.tileX < this.gridWidth &&
      tile.tileY >= 0 &&
      tile.tileY < this.gridHeight
    ) {
      if (
        !this.highlightedTile ||
        this.highlightedTile.x !== tile.tileX ||
        this.highlightedTile.y !== tile.tileY
      ) {
        // Эмитим событие ухода со старого тайла, если был подсвечен другой
        if (this.highlightedTile) {
          this.eventBus?.emit(Events.TileUnhovered, {
            tileX: this.highlightedTile.x,
            tileY: this.highlightedTile.y,
          });
        }

        this.highlightedTile = { x: tile.tileX, y: tile.tileY };
        this.drawHighlight(tile.tileX, tile.tileY);

        // Эмитим событие наведения на тайл
        this.eventBus?.emit(Events.TileHovered, {
          tileX: tile.tileX,
          tileY: tile.tileY,
        });
      }
    } else {
      this.clearHighlight();
    }
  }

  /** Поиск тайла в точке с проверкой соседних тайлов */
  private findTileAtPoint(
    screenX: number,
    screenY: number,
    centerTileX: number,
    centerTileY: number,
  ): { tileX: number; tileY: number } | null {
    if (!this.isometricMath) return null;

    // Проверяем центральный тайл и соседние (включая диагональные)
    const offsets = [
      [0, 0], // Центральный
      [-1, 0], // Слева
      [1, 0], // Справа
      [0, -1], // Сверху
      [0, 1], // Снизу
      [-1, -1], // Слева-сверху
      [1, -1], // Справа-сверху
      [-1, 1], // Слева-снизу
      [1, 1], // Справа-снизу
    ];

    for (const [dx, dy] of offsets) {
      const tileX = centerTileX + dx;
      const tileY = centerTileY + dy;

      if (tileX >= 0 && tileX < this.gridWidth && tileY >= 0 && tileY < this.gridHeight) {
        if (this.isometricMath.isPointInTile(screenX, screenY, tileX, tileY)) {
          return { tileX, tileY };
        }
      }
    }

    return null;
  }

  /** Камера: zoom + drag + стрелки */
  private setupCameraControls(): void {
    if (!this.scene || !this.container) return;

    this.scene.input.mouse?.disableContextMenu();

    // Zoom
    this.scene.input.on('wheel', (pointer: Phaser.Input.Pointer, deltaY: number) => {
      const container = this.container!;
      const oldScale = container.scale;
      const zoomSpeed = 0.001;

      const newScale = Phaser.Math.Clamp(oldScale - deltaY * zoomSpeed, 0.1, 2.0);

      const worldX = (pointer.x - container.x) / oldScale;
      const worldY = (pointer.y - container.y) / oldScale;

      const newX = pointer.x - worldX * newScale;
      const newY = pointer.y - worldY * newScale;

      container.setScale(newScale);
      container.setPosition(newX, newY);

      // Эмитим событие изменения зума камеры
      this.eventBus?.emit(Events.CameraZoomed, {
        scale: newScale,
        x: newX,
        y: newY,
      });
    });

    // Drag
    this.scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown() || p.middleButtonDown()) {
        this.isDragging = true;
        this.dragStartX = p.x;
        this.dragStartY = p.y;
      }
    });

    this.scene.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonReleased() || p.middleButtonReleased()) {
        this.isDragging = false;
        // Эмитим событие перемещения камеры после завершения drag
        if (this.container) {
          this.eventBus?.emit(Events.CameraMoved, {
            x: this.container.x,
            y: this.container.y,
            scale: this.container.scale,
          });
        }
      }
    });

    this.scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.isDragging && this.container) {
        const dx = p.x - this.dragStartX;
        const dy = p.y - this.dragStartY;
        this.container.x += dx;
        this.container.y += dy;
        this.dragStartX = p.x;
        this.dragStartY = p.y;

        // Эмитим событие перемещения камеры во время drag
        this.eventBus?.emit(Events.CameraMoved, {
          x: this.container.x,
          y: this.container.y,
          scale: this.container.scale,
        });
      }
    });

    const arrows = this.scene.input.keyboard?.createCursorKeys();
    if (arrows) {
      const speed = 10;
      this.scene.events.on('update', () => {
        if (!this.container || this.isDragging) return;

        if (arrows.left?.isDown) this.container.x += speed;
        if (arrows.right?.isDown) this.container.x -= speed;
        if (arrows.up?.isDown) this.container.y += speed;
        if (arrows.down?.isDown) this.container.y -= speed;
      });
    }
  }

  destroy(): void {
    if (this.scene) {
      this.scene.input.off('pointermove', this.handlePointerMove, this);
      this.scene.input.off('pointerout', this.clearHighlight, this);
      this.scene.input.off('pointerdown', this.handlePointerDown, this);
      this.scene.events.off('update');
    }

    this.highlightGraphics?.destroy();
    this.container?.destroy();

    this.scene = undefined;

    console.warn('🗺 GridModule destroyed');
  }
}
