import Phaser from 'phaser';
import { debugLog } from '@/infrastructure/utils/logger';
import { IMapService } from './map_service';
import { IsometricMath } from '@/infrastructure/isometric_math/isometric_math';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '@/core/event_bus/events';

/**
 * Рендерер карты для Phaser.
 * Отвечает только за визуализацию карты, управление камерой и пользовательский ввод.
 *
 * Теги: `arch:ui`, `arch:map`, `feature:map`, `feature:phaser`
 */
export class MapRenderer {
  private readonly tileWidth: number = 128;
  private readonly tileHeight: number = 64;

  private scene?: Phaser.Scene;
  private gridContainer?: Phaser.GameObjects.Container;
  private highlightGraphics?: Phaser.GameObjects.Graphics;
  private isometricMath?: IsometricMath;

  // Управление камерой
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;

  // Текущий подсвеченный тайл
  private highlightedTile: { x: number; y: number } | null = null;

  constructor(
    private mapService: IMapService,
    private eventBus: EventBus,
  ) {}

  /**
   * Присоединить рендерер к сцене Phaser
   */
  attachToScene(scene: Phaser.Scene): void {
    debugLog('🗺️ MapRenderer: присоединение к сцене');
    this.scene = scene;
    this.isometricMath = new IsometricMath(this.tileWidth, this.tileHeight);

    this.cleanup();
    this.createGrid();
  }

  /**
   * Отсоединить рендерер от сцены
   */
  detachFromScene(): void {
    debugLog('🗺️ MapRenderer: отсоединение от сцены');
    this.cleanup();
    this.scene = undefined;
  }

  /**
   * Очистить все визуальные объекты
   */
  private cleanup(): void {
    this.highlightGraphics?.destroy();
    this.gridContainer?.destroy(true);

    this.highlightGraphics = undefined;
    this.gridContainer = undefined;
  }

  /**
   * Создать визуальную сетку карты
   */
  private createGrid(): void {
    if (!this.scene || !this.isometricMath) {
      debugLog('MapRenderer: сцена или isometricMath не установлены');
      return;
    }

    debugLog('🗺️ Создание сетки');

    // Контейнер карты
    this.gridContainer = this.scene.add.container(0, 0).setDepth(0);

    // Graphics только под подсветку!
    this.highlightGraphics = this.scene.add.graphics();
    this.gridContainer.add(this.highlightGraphics);

    this.centerMap();
    this.drawGrid();
    this.setupCameraControls();
  }

  /** Центрирование карты */
  private centerMap(): void {
    if (!this.scene || !this.gridContainer) return;

    const camera = this.scene.cameras.main;
    const cx = camera.width / 2;
    const cy = camera.height / 2;

    this.gridContainer.setPosition(cx, cy);
    this.isometricMath?.setOffset(0, 0);

    // Эмитим событие центрирования карты
    this.eventBus.emit(Events.MapCentered, {
      x: cx,
      y: cy,
    });
  }

  /** Основная отрисовка сетки */
  private drawGrid(): void {
    if (!this.scene || !this.gridContainer || !this.isometricMath) return;

    const mapData = this.mapService.getMapData();

    for (let y = 0; y < this.mapService.getHeight(); y++) {
      for (let x = 0; x < this.mapService.getWidth(); x++) {
        this.drawTileTexture(x, y, mapData.tiles[y][x]);
      }
    }
  }

  private drawTileTexture(tileX: number, tileY: number, tileType: number): void {
    if (!this.scene || !this.gridContainer || !this.isometricMath) return;

    const center = this.isometricMath.tileToScreen(tileX, tileY);

    const img = this.scene.add.image(center.x, center.y, this.getTextureKey(tileType));

    // Центрирование в изометрии
    img.setOrigin(0.5, 0.5);

    // Масштаб текстуры под размер ромба
    img.setDisplaySize(this.tileWidth, this.tileHeight);

    this.gridContainer.add(img);
  }

  private getTextureKey(tileType: number): string {
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

    return TextureType[tileType] || 'GRASS_BASE_0';
  }

  /** Камера: zoom + drag + стрелки */
  private setupCameraControls(): void {
    if (!this.scene || !this.gridContainer) return;

    this.scene.input.mouse?.disableContextMenu();

    // Zoom - правильная подписка на событие колесика
    this.scene.input.on(
      'wheel',
      (
        pointer: Phaser.Input.Pointer,
        _currentlyOver: Phaser.GameObjects.GameObject[],
        deltaX: number,
        deltaY: number,
        _deltaZ: number,
      ) => {
        this.handleZoom(pointer, deltaY);
      },
    );

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
      }
    });

    this.scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.isDragging && this.gridContainer) {
        const dx = p.x - this.dragStartX;
        const dy = p.y - this.dragStartY;
        this.gridContainer.x += dx;
        this.gridContainer.y += dy;
        this.dragStartX = p.x;
        this.dragStartY = p.y;
      }
    });

    const arrows = this.scene.input.keyboard?.createCursorKeys();
    if (arrows) {
      const speed = 10;
      this.scene.events.on('update', () => {
        if (!this.gridContainer || this.isDragging) return;

        if (arrows.left?.isDown) this.gridContainer.x += speed;
        if (arrows.right?.isDown) this.gridContainer.x -= speed;
        if (arrows.up?.isDown) this.gridContainer.y += speed;
        if (arrows.down?.isDown) this.gridContainer.y -= speed;
      });
    }
  }

  /** Обработка зума */
  private handleZoom(pointer: Phaser.Input.Pointer, deltaY: number): void {
    if (!this.gridContainer) return;

    const oldScale = this.gridContainer.scale;
    const zoomSpeed = 0.001;

    const newScale = Phaser.Math.Clamp(oldScale - deltaY * zoomSpeed, 0.1, 2.0);

    const worldX = (pointer.x - this.gridContainer.x) / oldScale;
    const worldY = (pointer.y - this.gridContainer.y) / oldScale;

    const newX = pointer.x - worldX * newScale;
    const newY = pointer.y - worldY * newScale;

    this.gridContainer.setScale(newScale);
    this.gridContainer.setPosition(newX, newY);

    // Эмитим событие изменения зума камеры
    this.eventBus.emit(Events.CameraZoomed, {
      scale: newScale,
      x: newX,
      y: newY,
    });
  }

  /**
   * Обновить рендеринг после изменения данных карты
   */
  updateTile(tileX: number, tileY: number): void {
    if (!this.scene || !this.gridContainer || !this.isometricMath) return;

    // Перерисовать конкретный тайл
    // TODO: Оптимизировать - перерисовывать только измененный тайл
    this.cleanup();
    this.createGrid();
  }
}
