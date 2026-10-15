import type { EventBus } from '@/core/event_bus/event_bus';
import { Events } from '@/core/event_bus/events';
import type {
  EntitySpawnedPayload,
  ZoneClearedPayload,
  ZonePlacedPayload,
} from '@/core/event_bus/types';
import { Logger } from '@/core/utils/logger';

export const ZONE_COLORS = {
  living: 0x00ff00,
  commercial: 0x0000ff,
  cleared: 0xffff00,
} as const;

export interface ZoneRect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Чистая функция: нормализовать прямоугольник выделения (тестируется без Phaser). */
export function toZoneRect(
  start: { x: number; y: number },
  end: { x: number; y: number },
): ZoneRect {
  return {
    minX: Math.min(start.x, end.x),
    minY: Math.min(start.y, end.y),
    maxX: Math.max(start.x, end.x),
    maxY: Math.max(start.y, end.y),
  };
}

/**
 * Рендер зон и сущностей: только читает события/ECS, пишет только в Phaser-объекты.
 * Создаётся в MapModule.onSceneReady, живёт в отдельном контейнере поверх тайлов.
 */
export class ZoneRenderer {
  private layer?: Phaser.GameObjects.Graphics;
  private unsubscribers: Array<() => void> = [];
  private logger: Logger = Logger.create('ZoneRenderer');

  constructor(
    private scene: Phaser.Scene,
    private container: Phaser.GameObjects.Container,
    private tileToScreen: (tileX: number, tileY: number) => { x: number; y: number },
    private eventBus: EventBus,
  ) {}

  attach(): void {
    this.layer = this.scene.add.graphics().setDepth(20);
    this.container.add(this.layer);

    const offPlaced = this.eventBus.on(Events.ZonePlaced, (payload) => {
      this.drawZone(payload as ZonePlacedPayload | undefined, false);
    });
    const offCleared = this.eventBus.on(Events.ZoneCleared, (payload) => {
      this.drawZone(payload as ZoneClearedPayload | undefined, true);
    });
    const offSpawned = this.eventBus.on(Events.EntitySpawned, (payload) => {
      this.drawSpawn(payload as EntitySpawnedPayload | undefined);
    });
    this.unsubscribers.push(offPlaced, offCleared, offSpawned);
  }

  destroy(): void {
    for (const off of this.unsubscribers) off();
    this.unsubscribers = [];
    this.layer?.destroy();
    this.layer = undefined;
  }

  private drawZone(
    payload: ZonePlacedPayload | ZoneClearedPayload | undefined,
    cleared: boolean,
  ): void {
    if (!payload || !this.layer) return;
    const rect = toZoneRect(payload.start, payload.end);
    const color = cleared
      ? ZONE_COLORS.cleared
      : (ZONE_COLORS[(payload as ZonePlacedPayload).kind] ?? ZONE_COLORS.living);
    const topLeft = this.tileToScreen(rect.minX, rect.minY);
    const bottomRight = this.tileToScreen(rect.maxX + 1, rect.maxY + 1);
    this.layer.lineStyle(3, color, 1);
    this.layer.strokeRect(
      topLeft.x,
      topLeft.y,
      bottomRight.x - topLeft.x,
      bottomRight.y - topLeft.y,
    );
    this.logger.debug(`Zone overlay: ${rect.minX},${rect.minY}-${rect.maxX},${rect.maxY}`);
  }

  private drawSpawn(payload: EntitySpawnedPayload | undefined): void {
    if (!payload || !this.layer) return;
    const p = this.tileToScreen(payload.tileX, payload.tileY);
    this.layer.fillStyle(0xffffff, 1);
    this.layer.fillCircle(p.x, p.y, 4);
  }
}
