import { debugGroup, debugGroupEnd, debugLog } from '@/infrastructure/utils/logger';
import { DEFAULT_MAP } from './maps/default_map';
import { MapData } from './types';
import { GameCore } from '../game_core/game_core';
import { Events } from '@/core/event_bus/events';
import Phaser from 'phaser';
import { IsometricMath } from '@/infrastructure/isometric_math/isometric_math';
import { EventBus } from '../event_bus/event_bus';

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

export class MapManager {
  private gridWidth!: number;
  private gridHeight!: number;
  private readonly tileWidth: number = 128;
  private readonly tileHeight: number = 64;
  private eventBus?: EventBus;

  private mapData?: MapData;
  private scene?: Phaser.Scene;
  private gridContainer?: Phaser.GameObjects.Container;
  private highlightGraphics?: Phaser.GameObjects.Graphics;

  private isometricMath?: IsometricMath;
  private readonly core: GameCore;

  // Управление камерой
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;

  // Текущий подсвеченный тайл
  private highlightedTile: { x: number; y: number } | null = null;

  constructor(core: GameCore) {
    this.core = core;
    this.eventBus = core.getEventBus();
  }

  initialize(): void {
    debugGroup('🗺️ MapManager: инициализация');
    this.isometricMath = new IsometricMath(this.tileWidth, this.tileHeight);
    this.loadMap();

    const activeScene = this.core.getSceneController()?.getActiveScene();
    if (activeScene) {
      this.attachToScene(activeScene);
    }
    debugGroupEnd();
  }

  attachToScene(scene: Phaser.Scene): void {
    this.scene = scene;

    if (!this.mapData) {
      this.loadMap();
    }
    if (!this.isometricMath) {
      this.isometricMath = new IsometricMath(this.tileWidth, this.tileHeight);
    }

    this.cleanupGrid();
    this.createGrid();
  }

  private createGrid(): void {
    debugLog('🗺️ Создание сетки');
    if (!this.isometricMath) {
      debugLog('MapManager: isometricMath не инициализирован');
      return;
    }
    if (!this.scene) {
      debugLog('MapManager: scene не установлена');
      return;
    }

    // Контейнер карты
    this.gridContainer = this.scene.add.container(0, 0).setDepth(0);

    // Graphics только под подсветку!
    this.highlightGraphics = this.scene.add.graphics();
    this.gridContainer.add(this.highlightGraphics);

    this.centerMap();
    this.drawGrid();
    this.setupCameraControls();

    // this.scene.input.on('pointermove', this.handlePointerMove, this);
    // this.scene.input.on('pointerout', this.clearHighlight, this);
    // this.scene.input.on('pointerdown', this.handlePointerDown, this);
  }

  private loadMap(): void {
    debugLog('🗺️ Загрузка карты');
    this.mapData = DEFAULT_MAP;
    this.gridWidth = this.mapData.mapWidth;
    this.gridHeight = this.mapData.mapHeight;
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
    this.eventBus?.emit(Events.MapCentered, {
      x: cx,
      y: cy,
    });
  }

  /** Основная отрисовка сетки — теперь плитки рендерятся как Image */
  private drawGrid(): void {
    if (!this.scene || !this.gridContainer || !this.isometricMath || !this.mapData) return;

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.drawTileTexture(x, y, this.mapData.tiles[y][x]);
      }
    }
  }

  private drawTileTexture(tileX: number, tileY: number, tileType: number): void {
    if (!this.scene || !this.gridContainer || !this.isometricMath) return;

    const center = this.isometricMath.tileToScreen(tileX, tileY);

    const img = this.scene.add.image(center.x, center.y, TextureType[tileType]);

    // Центрирование в изометрии
    img.setOrigin(0.5, 0.5);

    // Масштаб текстуры под размер ромба
    img.setDisplaySize(this.tileWidth, this.tileHeight);

    this.gridContainer.add(img);
  }

  private cleanupGrid(): void {
    this.highlightGraphics?.destroy();
    this.gridContainer?.destroy(true);

    this.highlightGraphics = undefined;
    this.gridContainer = undefined;
  }

  /**
   * Получить информацию о тайле по координатам
   */
  public getTileInfo(
    tileX: number,
    tileY: number,
  ): {
    x: number;
    y: number;
    type: number;
    typeName: string;
  } | null {
    if (tileX < 0 || tileX >= this.gridWidth || tileY < 0 || tileY >= this.gridHeight) {
      return null;
    }

    const tileType = DEFAULT_MAP.tiles[tileY][tileX];
    const typeName = TextureType[tileType] || 'UNKNOWN';

    return {
      x: tileX,
      y: tileY,
      type: tileType,
      typeName,
    };
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
        // Эмитим событие перемещения камеры после завершения drag
        if (this.gridContainer) {
          // this.eventBus?.emit(Events.CameraMoved, {
          //   x: this.container.x,
          //   y: this.container.y,
          //   scale: this.container.scale,
          // });
        }
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

        // Эмитим событие перемещения камеры во время drag
        // this.eventBus?.emit(Events.CameraMoved, {
        //   x: this.container.x,
        //   y: this.container.y,
        //   scale: this.container.scale,
        // });
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
    this.eventBus?.emit(Events.CameraZoomed, {
      scale: newScale,
      x: newX,
      y: newY,
    });
  }
}
