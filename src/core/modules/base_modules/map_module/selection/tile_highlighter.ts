import { EventBus } from '@/core/event_bus/event_bus';
import { Events } from '@/core/event_bus/events';
import { IsometricMath } from '../infrastructure/isometric_math';

export class TileHighlighter {
  private graphics: Phaser.GameObjects.Graphics;
  private highlightedTile: { x: number; y: number } | null = null;

  constructor(
    private scene: Phaser.Scene,
    container: Phaser.GameObjects.Container,
    private isometricMath: IsometricMath,
    private eventBus: EventBus,
    private readonly tileWidth: number,
    private readonly tileHeight: number,
  ) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(20);
    container.add(this.graphics);
  }

  public highlight(tileX: number, tileY: number): void {
    if (this.isHighlighted(tileX, tileY)) return;

    this.clear();
    this.highlightedTile = { x: tileX, y: tileY };
    this.draw(tileX, tileY);

    this.eventBus.emit(Events.TileHovered, { tileX, tileY });
  }

  private draw(tileX: number, tileY: number): void {
    this.graphics.clear();

    const center = this.isometricMath.tileToScreen(tileX, tileY);
    const hw = this.tileWidth / 2;
    const hh = this.tileHeight / 2;

    this.graphics.fillStyle(0xffffff, 0.2);
    this.graphics.lineStyle(3, 0x00ff00, 0.5);

    this.graphics.beginPath();
    this.graphics.moveTo(center.x, center.y - hh);
    this.graphics.lineTo(center.x + hw, center.y);
    this.graphics.lineTo(center.x, center.y + hh);
    this.graphics.lineTo(center.x - hw, center.y);
    this.graphics.closePath();

    this.graphics.fillPath();
    this.graphics.strokePath();
  }

  public clear(): void {
    if (this.highlightedTile) {
      this.eventBus.emit(Events.TileUnhovered, {
        tileX: this.highlightedTile.x,
        tileY: this.highlightedTile.y,
      });
    }

    this.graphics.clear();
    this.highlightedTile = null;
  }

  private isHighlighted(tileX: number, tileY: number): boolean {
    return this.highlightedTile?.x === tileX && this.highlightedTile?.y === tileY;
  }

  public getHighlightedTile() {
    return this.highlightedTile;
  }
}
