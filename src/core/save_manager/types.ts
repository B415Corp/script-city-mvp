import { EntityId } from '../ecs_manager/types';

/**
 * Интерфейс сохраненной игры
 */
export interface SaveGame {
  // metadata: метаданные игры
  metadata: SaveMetadata;

  // core: данные игры
  core: CoreSaveData;

  // ecs: данные ecs
  ecs: ECSData;

  // module: данные модулей
  module: ModuleData;
}

export interface SaveMetadata {
  version: string;
  gameVersion: string;
  timestamp: number;
  saveName: string;
  playerName: string;
  playTime: number;
}

export interface CoreSaveData {
  tickRate: number;
  currentTick: number;
  gameSpeed: number;
}

export interface ECSData {
  entities: EntityId[];
  entityIdCounter: number;
  components: SerializedComponents;
}

export interface ModuleData {
  // Словарь: moduleId -> сериализованные данные модуля
  [moduleId: string]: unknown;
}

export interface SerializedComponents {
  [entityId: string]: {
    [componentType: string]: unknown;
  };
}

/**
 * Опции сохранения
 */
export interface SaveOptions {
  saveName?: string;
  compress?: boolean; // Сжатие данных (для будущего)
  autoSave?: boolean; // Автосохранение
}

/**
 * Интерфейс для модулей, которые хотят участвовать в сохранении
 */
export interface ISaveable {
  /**
   * Сериализация данных модуля
   */
  serialize(): unknown;

  /**
   * Десериализация данных модуля
   */
  deserialize(data: unknown): void;
}
