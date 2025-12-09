import { EventBus } from '../event_bus/event_bus';
import { Events } from '@/core/event_bus/events';
import { debugGroup, debugGroupEnd, debugLog } from '@/infrastructure/utils/logger';
import { DEFAULT_MAP } from './maps/default_map';
import { MapData } from './types';

/**
 * Интерфейс сервиса карты.
 * Предоставляет доступ к данным карты и генерирует события.
 *
 * Теги: `arch:core`, `arch:map`, `feature:map`
 */
export interface IMapService {
  /** Получить ширину карты в тайлах */
  getWidth(): number;

  /** Получить высоту карты в тайлах */
  getHeight(): number;

  /** Получить данные карты */
  getMapData(): MapData;

  /** Получить информацию о тайле по координатам */
  getTileInfo(
    tileX: number,
    tileY: number,
  ): {
    x: number;
    y: number;
    type: number;
    typeName: string;
  } | null;

  /** Установить новый тайл */
  setTile(tileX: number, tileY: number, tileType: number): boolean;

  /** Проверить, находятся ли координаты в пределах карты */
  isValidTile(tileX: number, tileY: number): boolean;
}

/**
 * Сервис карты - core реализация.
 * Управляет данными карты и генерирует события об изменениях.
 *
 * Теги: `arch:core`, `arch:map`, `feature:map`
 */
export class MapService implements IMapService {
  private mapData: MapData;
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    debugGroup('🗺️ MapService: создание');
    this.eventBus = eventBus;
    this.mapData = DEFAULT_MAP;
    debugLog('Карта загружена', {
      width: this.mapData.mapWidth,
      height: this.mapData.mapHeight,
    });
    debugGroupEnd();
  }

  getWidth(): number {
    return this.mapData.mapWidth;
  }

  getHeight(): number {
    return this.mapData.mapHeight;
  }

  getMapData(): MapData {
    return this.mapData;
  }

  getTileInfo(
    tileX: number,
    tileY: number,
  ): {
    x: number;
    y: number;
    type: number;
    typeName: string;
  } | null {
    if (!this.isValidTile(tileX, tileY)) {
      return null;
    }

    const tileType = this.mapData.tiles[tileY][tileX];
    const typeName = this.getTileTypeName(tileType);

    return {
      x: tileX,
      y: tileY,
      type: tileType,
      typeName,
    };
  }

  setTile(tileX: number, tileY: number, tileType: number): boolean {
    if (!this.isValidTile(tileX, tileY)) {
      return false;
    }

    const oldType = this.mapData.tiles[tileY][tileX];
    if (oldType === tileType) {
      return true; // Уже установлено
    }

    this.mapData.tiles[tileY][tileX] = tileType;

    // Генерируем событие изменения тайла
    this.eventBus.emit(Events.TileChanged, {
      x: tileX,
      y: tileY,
      oldType,
      newType: tileType,
    });

    return true;
  }

  isValidTile(tileX: number, tileY: number): boolean {
    return (
      tileX >= 0 && tileX < this.mapData.mapWidth && tileY >= 0 && tileY < this.mapData.mapHeight
    );
  }

  private getTileTypeName(tileType: number): string {
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

    return TextureType[tileType] || 'UNKNOWN';
  }
}
