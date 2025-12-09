import { debugGroup, debugGroupEnd, debugLog } from '@/infrastructure/utils/logger';
import { GameCore } from '../game_core/game_core';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '@/core/event_bus/events';
import Phaser from 'phaser';
import { IMapService, MapService } from './map_service';
import { MapRenderer } from './map_renderer';

/**
 * Менеджер карты - фасад для работы с картой.
 * Делегирует работу между MapService (данные) и MapRenderer (визуализация).
 *
 * Теги: `arch:core`, `arch:map`, `feature:map`
 */
export class MapManager {
  private mapService: IMapService;
  private mapRenderer: MapRenderer;
  private eventBus: EventBus;
  private readonly core: GameCore;

  constructor(core: GameCore) {
    debugGroup('🗺️ MapManager: создание');
    this.core = core;
    this.eventBus = core.getEventBus();

    // Создаем сервис и рендерер
    this.mapService = new MapService(this.eventBus);
    this.mapRenderer = new MapRenderer(this.mapService, this.eventBus);

    debugGroupEnd();
  }

  initialize(): void {
    debugGroup('🗺️ MapManager: инициализация');

    const activeScene = this.core.getSceneController()?.getActiveScene();
    if (activeScene) {
      this.attachToScene(activeScene);
    }

    // Подписываемся на события изменения тайлов для обновления рендеринга
    this.eventBus.on<{ x: number; y: number; oldType: number; newType: number }>(Events.TileChanged, (payload) => {
      if (payload) {
        this.mapRenderer.updateTile(payload.x, payload.y);
      }
    });

    debugGroupEnd();
  }

  attachToScene(scene: Phaser.Scene): void {
    this.mapRenderer.attachToScene(scene);
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
    return this.mapService.getTileInfo(tileX, tileY);
  }

  /**
   * Установить новый тайл
   */
  public setTile(tileX: number, tileY: number, tileType: number): boolean {
    return this.mapService.setTile(tileX, tileY, tileType);
  }

  /**
   * Получить доступ к сервису карты (для продвинутых операций)
   */
  public getMapService(): IMapService {
    return this.mapService;
  }

  /**
   * Получить доступ к рендереру карты (для продвинутых операций)
   */
  public getMapRenderer(): MapRenderer {
    return this.mapRenderer;
  }
}
