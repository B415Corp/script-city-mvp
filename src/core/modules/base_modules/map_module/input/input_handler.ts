import { IsometricMath } from '../infrastructure/isometric_math';
import { TileHighlighter } from '../selection/tile_highlighter';
import { TileSelector } from '../selection/tile_selector';
import { EventBus } from '@/core/event_bus/event_bus';
import { Events } from '@/core/event_bus/events';
import { TileInfo, TileCoordinates } from '../types';

export class InputHandler {
  constructor(
    private scene: Phaser.Scene,
    private container: Phaser.GameObjects.Container,
    private isometricMath: IsometricMath,
    private highlighter: TileHighlighter,
    private selector: TileSelector,
    private eventBus: EventBus,
    private readonly gridWidth: number,
    private readonly gridHeight: number,
    private getCameraIsDragging: () => boolean,
    private getTileInfo: (x: number, y: number) => TileInfo | null,
  ) {
    this.attachListeners();
  }

  private attachListeners(): void {
    this.scene.input.on('pointermove', this.handlePointerMove, this);
    this.scene.input.on('pointerout', () => this.highlighter.clear());
    this.scene.input.on('pointerdown', this.handlePointerDown, this);
    this.scene.input.on('pointerup', this.handlePointerUp, this);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.getCameraIsDragging()) return;

    const tile = this.getTileAtPointer(pointer);
    if (!tile) {
      this.highlighter.clear();
      return;
    }

    // Обновление выделения области
    if (this.selector.isSelectingArea()) {
      this.selector.updateSelection(tile.tileX, tile.tileY);
      return;
    }

    // Обычный hover
    this.highlighter.highlight(tile.tileX, tile.tileY);

    const tileInfo = this.getTileInfo(tile.tileX, tile.tileY);
    this.eventBus.emit(Events.TileHovered, {
      tileX: tile.tileX,
      tileY: tile.tileY,
      tileType: tileInfo?.type,
      tileTypeName: tileInfo?.typeName,
    });
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (pointer.rightButtonDown() || pointer.middleButtonDown()) return;

    if (pointer.leftButtonDown()) {
      const tile = this.getTileAtPointer(pointer);
      if (tile) {
        this.selector.startSelection(tile.tileX, tile.tileY);
      }
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (this.selector.isSelectingArea() && pointer.leftButtonReleased()) {
      const tile = this.getTileAtPointer(pointer);
      if (tile) {
        this.selector.endSelection(tile.tileX, tile.tileY);
      }
      return;
    }

    if (pointer.leftButtonReleased()) {
      const tile = this.getTileAtPointer(pointer);
      if (tile) {
        this.eventBus.emit(Events.TileClickedUp, {
          tileX: tile.tileX,
          tileY: tile.tileY,
        });
      }
    }
  }

  private getTileAtPointer(pointer: Phaser.Input.Pointer): TileCoordinates | null {
    const containerX = (pointer.x - this.container.x) / this.container.scale;
    const containerY = (pointer.y - this.container.y) / this.container.scale;

    const approximateTile = this.isometricMath.screenToTile(containerX, containerY);
    return this.findTileAtPoint(
      containerX,
      containerY,
      approximateTile.tileX,
      approximateTile.tileY,
    );
  }

  private findTileAtPoint(
    screenX: number,
    screenY: number,
    centerTileX: number,
    centerTileY: number,
  ): TileCoordinates | null {
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
}
