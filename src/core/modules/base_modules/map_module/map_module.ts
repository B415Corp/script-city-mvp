import { getTextureType } from '@/core/scenes';
import { BaseModule } from '../../extends';
import { IsometricMath } from './infrastructure/isometric_math';
import { DEFAULT_MAP } from './infrastructure/maps/default_map';
import { Events } from '@/core/event_bus/events';
import { EventBus } from '@/core/event_bus/event_bus';

export class MapModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;
  private isometricMath?: IsometricMath;
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

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    console.log('MapModule init');
    super(scene, eventBus);
    this.scene = scene;
    this.eventBus = eventBus;
    this.isometricMath = new IsometricMath(this.tileWidth, this.tileHeight);
    this.attachToScene(scene);
  }

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
    const typeName = getTextureType(tileType);

    return {
      x: tileX,
      y: tileY,
      type: tileType,
      typeName,
    };
  }

  attachToScene(scene: Phaser.Scene): void {
    this.scene = scene;

    if (!this.isometricMath) {
      throw new Error('GridModule not initialized');
    }

    // Контейнер карты
    this.container = scene.add.container(0, 0).setDepth(10);

    this.centerMap();
    this.setupCameraControls();

    scene.input.on('pointermove', this.handlePointerMove, this);
    scene.input.on('pointerout', this.clearHighlight, this);
    scene.input.on('pointerdown', this.handlePointerDown, this);
    scene.input.on('pointerup', this.handlePointerUp, this);

    // Подписываемся на событие готовности сцены
    this.eventBus.on(Events.SceneReady, () => this.onSceneReady());
  }

  /** Обработчик события готовности сцены */
  private onSceneReady(): void {
    // Сначала рисуем ВСЕ тайлы
    this.drawGrid();

    // Graphics создаём и добавляем ПОСЛЕДНИМ (поверх всех)
    this.highlightGraphics = this.scene.add.graphics();
    this.highlightGraphics.setDepth(20);
    this.container!.add(this.highlightGraphics);
  }

  /** Центрирование карты */
  private centerMap(): void {
    if (!this.scene || !this.container) return;

    const camera = this.scene.cameras.main;
    const cx = camera.width / 2;
    const cy = camera.height / 2;

    this.container.setPosition(cx, cy);
    this.isometricMath?.setOffset(0, 0);

    this.eventBus?.emit(Events.MapCentered, {
      x: cx,
      y: cy,
    });
  }

  /** Основная отрисовка сетки */
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

    const textureKey = getTextureType(tileType);

    if (!this.scene.textures.exists(textureKey)) {
      console.warn(`Texture ${textureKey} missing for tile ${tileX},${tileY}`);
      return;
    }

    const center = this.isometricMath.tileToScreen(tileX, tileY);

    const img = this.scene.add.image(center.x, center.y, textureKey);
    const texture = this.scene.textures.get(textureKey);

    img.setOrigin(0.5, 0.5);
    img.setScale(
      this.tileWidth / texture.source[0]?.width!,
      this.tileHeight / texture.source[0]?.height!,
    );

    const baseDepth = 10;
    const sortOffset = (tileY + tileX) * 0.01;
    img.setDepth(baseDepth + sortOffset);

    this.container.add(img);
  }

  /** Подсветка — поверх всех */
  private drawHighlight(tileX: number, tileY: number): void {
    if (!this.highlightGraphics || !this.isometricMath) return;

    this.highlightGraphics.clear();

    const center = this.isometricMath.tileToScreen(tileX, tileY);
    const hw = this.tileWidth / 2;
    const hh = this.tileHeight / 2;

    this.highlightGraphics.fillStyle(0xffffff, 0.2);
    this.highlightGraphics.lineStyle(3, 0x00ff00, 0.5);

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
      this.eventBus?.emit(Events.TileUnhovered, {
        tileX: this.highlightedTile.x,
        tileY: this.highlightedTile.y,
      });
    }
    this.highlightGraphics?.clear();
    this.highlightedTile = null;
  }

  /** Обработка зума */
  private handleZoom(pointer: Phaser.Input.Pointer, deltaY: number): void {
    if (!this.container) return;

    const oldScale = this.container.scale;
    const zoomSpeed = 0.001;

    const newScale = Phaser.Math.Clamp(oldScale - deltaY * zoomSpeed, 0.1, 2.0);

    const worldX = (pointer.x - this.container.x) / oldScale;
    const worldY = (pointer.y - this.container.y) / oldScale;

    const newX = pointer.x - worldX * newScale;
    const newY = pointer.y - worldY * newScale;

    this.container.setScale(newScale);
    this.container.setPosition(newX, newY);

    this.eventBus?.emit(Events.CameraZoomed, {
      scale: newScale,
      x: newX,
      y: newY,
    });
  }

  /** Публичные методы для UI */
  public zoomIn(): void {
    if (!this.container || !this.scene) return;

    const oldScale = this.container.scale;
    const newScale = Phaser.Math.Clamp(oldScale + 0.1, 0.1, 2.0);

    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;

    const worldX = (centerX - this.container.x) / oldScale;
    const worldY = (centerY - this.container.y) / oldScale;

    const newX = centerX - worldX * newScale;
    const newY = centerY - worldY * newScale;

    this.container.setScale(newScale);
    this.container.setPosition(newX, newY);

    this.eventBus?.emit(Events.CameraZoomed, {
      scale: newScale,
      x: newX,
      y: newY,
    });
  }

  public zoomOut(): void {
    if (!this.container || !this.scene) return;

    const oldScale = this.container.scale;
    const newScale = Phaser.Math.Clamp(oldScale - 0.1, 0.1, 2.0);

    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;

    const worldX = (centerX - this.container.x) / oldScale;
    const worldY = (centerY - this.container.y) / oldScale;

    const newX = centerX - worldX * newScale;
    const newY = centerY - worldY * newScale;

    this.container.setScale(newScale);
    this.container.setPosition(newX, newY);

    this.eventBus?.emit(Events.CameraZoomed, {
      scale: newScale,
      x: newX,
      y: newY,
    });
  }

  public moveCamera(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (!this.container) return;

    const speed = 50;

    switch (direction) {
      case 'up':
        this.container.y += speed;
        break;
      case 'down':
        this.container.y -= speed;
        break;
      case 'left':
        this.container.x += speed;
        break;
      case 'right':
        this.container.x -= speed;
        break;
    }
  }

  /** Обработка клика по тайлу */
  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.isDragging) return;
    if (!this.scene || !this.container || !this.isometricMath) return;

    if (!pointer.leftButtonDown()) {
      return;
    }

    const containerX = (pointer.x - this.container.x) / this.container.scale;
    const containerY = (pointer.y - this.container.y) / this.container.scale;

    const approximateTile = this.isometricMath.screenToTile(containerX, containerY);

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
      this.eventBus?.emit(Events.TileClicked, {
        tileX: tile.tileX,
        tileY: tile.tileY,
      });
    }
  }

  /** Обработка отпускания клика */
  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.isDragging) return;
    if (!this.scene || !this.container || !this.isometricMath) return;

    if (!pointer.leftButtonReleased()) {
      return;
    }

    const containerX = (pointer.x - this.container.x) / this.container.scale;
    const containerY = (pointer.y - this.container.y) / this.container.scale;

    const approximateTile = this.isometricMath.screenToTile(containerX, containerY);

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
      this.eventBus?.emit(Events.TileClickedUp, {
        tileX: tile.tileX,
        tileY: tile.tileY,
      });
    }
  }

  /** Реакция на передвижение мыши */
  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.isDragging) return;
    if (!this.scene || !this.container || !this.isometricMath) return;

    const containerX = (pointer.x - this.container.x) / this.container.scale;
    const containerY = (pointer.y - this.container.y) / this.container.scale;

    const approximateTile = this.isometricMath.screenToTile(containerX, containerY);

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
        if (this.highlightedTile) {
          this.eventBus?.emit(Events.TileUnhovered, {
            tileX: this.highlightedTile.x,
            tileY: this.highlightedTile.y,
          });
        }

        this.highlightedTile = { x: tile.tileX, y: tile.tileY };
        this.drawHighlight(tile.tileX, tile.tileY);

        const tileInfo = this.getTileInfo(tile.tileX, tile.tileY);

        this.eventBus?.emit(Events.TileHovered, {
          tileX: tile.tileX,
          tileY: tile.tileY,
          tileType: tileInfo?.type,
          tileTypeName: tileInfo?.typeName,
        });
      }
    } else {
      this.clearHighlight();
    }
  }

  /** Поиск тайла в точке */
  private findTileAtPoint(
    screenX: number,
    screenY: number,
    centerTileX: number,
    centerTileY: number,
  ): { tileX: number; tileY: number } | null {
    if (!this.isometricMath) return null;

    const offsets = [
      [0, 0],
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
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
      if (this.isDragging && this.container) {
        const dx = p.x - this.dragStartX;
        const dy = p.y - this.dragStartY;
        this.container.x += dx;
        this.container.y += dy;
        this.dragStartX = p.x;
        this.dragStartY = p.y;
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
}

export default MapModule;
