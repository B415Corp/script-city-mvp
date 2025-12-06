import { debugGroup, debugGroupEnd, debugLog } from '@/infrastructure/utils/logger';
import { DEFAULT_MAP } from './maps/default_map';
import { MapData } from './types';
import { GameCore } from '../game_core/game_core';
import Phaser, { Events } from 'phaser';
import { IsometricMath } from '@/infrastructure/isometric_math/isometric_math';

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

  private mapData?: MapData;
  private scene?: Phaser.Scene;
  private gridContainer?: Phaser.GameObjects.Container;
  private highlightGraphics?: Phaser.GameObjects.Graphics;

  private isometricMath?: IsometricMath;
  private readonly core: GameCore;

  constructor(core: GameCore) {
    this.core = core;
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
    // this.setupCameraControls();

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
    // this.eventBus?.emit(Events.MapCentered, {
    //   x: cx,
    //   y: cy,
    // });
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
}
