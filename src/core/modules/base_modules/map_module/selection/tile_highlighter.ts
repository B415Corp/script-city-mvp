import { EventBus } from '@/core/event_bus/event_bus';
import { Events } from '@/core/event_bus/events';
import { IsometricMath } from '../infrastructure/isometric_math';

type HoverStyle = {
  fill: number;
  fillAlpha: number;
  line: number;
  lineAlpha: number;
  lineWidth: number;
};

export class TileHighlighter {
  private graphics: Phaser.GameObjects.Graphics; // графический объект для рисования выделения
  private highlightedTile: { x: number; y: number } | null = null; // выделенный тайл
  private style: HoverStyle = {
    fill: 0xffffff,
    fillAlpha: 0.2,
    line: 0x00ff00,
    lineAlpha: 0.5,
    lineWidth: 3,
  };

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

  // Выделение тайла
  public highlight(tileX: number, tileY: number): void {
    if (this.isHighlighted(tileX, tileY)) return;

    this.clear();
    this.highlightedTile = { x: tileX, y: tileY };
    this.draw(tileX, tileY);

    this.eventBus.emit(Events.TileHovered, { tileX, tileY });
  }

  // Рисование выделения
  private draw(tileX: number, tileY: number): void {
    this.graphics.clear(); // сбрасывает стили [web:84]

    const center = this.isometricMath.tileToScreen(tileX, tileY);
    const hw = this.tileWidth / 2;
    const hh = this.tileHeight / 2;

    // Всегда заново выставляем стиль после clear()
    this.graphics.fillStyle(this.style.fill, this.style.fillAlpha);
    this.graphics.lineStyle(this.style.lineWidth, this.style.line, this.style.lineAlpha);

    this.graphics.beginPath();
    this.graphics.moveTo(center.x, center.y - hh);
    this.graphics.lineTo(center.x + hw, center.y);
    this.graphics.lineTo(center.x, center.y + hh);
    this.graphics.lineTo(center.x - hw, center.y);
    this.graphics.closePath();

    this.graphics.fillPath();
    this.graphics.strokePath();
  }

  // Очистка выделения
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

  // Проверка, выделен ли тайл
  private isHighlighted(tileX: number, tileY: number): boolean {
    return this.highlightedTile?.x === tileX && this.highlightedTile?.y === tileY;
  }

  // Получение выделенного тайла
  public getHighlightedTile(): { x: number; y: number } | null {
    return this.highlightedTile;
  }

  // Установка стиля выделения
  public setStyle(style: HoverStyle): void {
    this.style = style;

    // Важно: если сейчас уже есть подсвеченный тайл — перерисовать
    if (this.highlightedTile) {
      this.draw(this.highlightedTile.x, this.highlightedTile.y);
    }
  }
}
