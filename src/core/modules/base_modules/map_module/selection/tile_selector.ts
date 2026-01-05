import { EventBus } from '@/core/event_bus/event_bus';
import { Events } from '@/core/event_bus/events';
import { IsometricMath } from '../infrastructure/isometric_math';

export class TileSelector {
  private graphics: Phaser.GameObjects.Graphics;
  private isSelecting = false;
  private selectStartTile: { x: number; y: number } | null = null;
  private selectedTiles: { x: number; y: number }[] = [];

  constructor(
    private scene: Phaser.Scene,
    container: Phaser.GameObjects.Container,
    private isometricMath: IsometricMath,
    private eventBus: EventBus,
    private readonly tileWidth: number,
    private readonly tileHeight: number,
    private readonly gridWidth: number,
    private readonly gridHeight: number,
  ) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(21);
    container.add(this.graphics);

    this.setupEscKey();
  }

  private setupEscKey(): void {
    const escKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey?.on('down', () => this.cancel());
  }

  public startSelection(tileX: number, tileY: number): void {
    this.isSelecting = true;
    this.selectStartTile = { x: tileX, y: tileY };
    this.selectedTiles = [{ x: tileX, y: tileY }];
    this.draw();

    this.eventBus.emit(Events.TileClicked, { tileX, tileY });
  }

  public updateSelection(tileX: number, tileY: number): void {
    if (!this.isSelecting || !this.selectStartTile) return;

    const x1 = Math.min(this.selectStartTile.x, tileX);
    const x2 = Math.max(this.selectStartTile.x, tileX);
    const y1 = Math.min(this.selectStartTile.y, tileY);
    const y2 = Math.max(this.selectStartTile.y, tileY);

    this.selectedTiles = [];
    for (let ty = y1; ty <= y2; ty++) {
      for (let tx = x1; tx <= x2; tx++) {
        if (tx >= 0 && tx < this.gridWidth && ty >= 0 && ty < this.gridHeight) {
          this.selectedTiles.push({ x: tx, y: ty });
        }
      }
    }

    this.draw();
  }

  public endSelection(tileX: number, tileY: number): void {
    if (!this.isSelecting || !this.selectStartTile) return;

    this.isSelecting = false;

    const x1 = Math.min(this.selectStartTile.x, tileX);
    const x2 = Math.max(this.selectStartTile.x, tileX);
    const y1 = Math.min(this.selectStartTile.y, tileY);
    const y2 = Math.max(this.selectStartTile.y, tileY);

    this.eventBus.emit(Events.TilesSelected, {
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      width: x2 - x1 + 1,
      height: y2 - y1 + 1,
      count: (x2 - x1 + 1) * (y2 - y1 + 1),
    });

    console.log(`Selected area: (${x1},${y1}) to (${x2},${y2})`);
  }

  private draw(): void {
    this.graphics.clear();

    if (this.selectedTiles.length === 0) return;

    this.graphics.fillStyle(0x00ff00, 0.3);
    this.graphics.lineStyle(2, 0xffffff, 1);

    for (const { x, y } of this.selectedTiles) {
      const center = this.isometricMath.tileToScreen(x, y);
      const hw = this.tileWidth / 2;
      const hh = this.tileHeight / 2;

      this.graphics.beginPath();
      this.graphics.moveTo(center.x, center.y - hh);
      this.graphics.lineTo(center.x + hw, center.y);
      this.graphics.lineTo(center.x, center.y + hh);
      this.graphics.lineTo(center.x - hw, center.y);
      this.graphics.closePath();

      this.graphics.fillPath();
      this.graphics.strokePath();
    }
  }

  public cancel(): void {
    if (this.isSelecting || this.selectedTiles.length > 0) {
      this.isSelecting = false;
      this.selectStartTile = null;
      this.selectedTiles = [];
      this.graphics.clear();

      console.log('Selection cancelled');
    }
  }

  public isSelectingArea(): boolean {
    return this.isSelecting;
  }
}
