import { EventBus } from '../event_bus/event_bus';
import { GameCore } from '../game_core/game_core';
import { CoreConfig } from '../game_core/types';
import {
  CoreSaveData,
  ECSData,
  ModuleData,
  SaveGame,
  SaveMetadata,
  SaveOptions,
  SerializedComponents,
} from './type';

const SAVE_VERSION = '1.0.0'; // Версия формата сохранений
const STORAGE_KEY_PREFIX = 'script_city_save_';
const STORAGE_KEY_LIST = 'script_city_saves_list';

export class SaveManager {
  private core?: GameCore;
  private eventBus?: EventBus;
  private config?: CoreConfig;

  constructor() {
    console.warn('💾 SaveManager initialized');
  }

  /**
   * Инициализирует SaveManager.
   * @param core GameCore
   * @param eventBus EventBus
   */
  public initialize(core: GameCore, eventBus: EventBus): void {
    this.core = core;
    this.eventBus = eventBus;
    this.config = core.getConfig();
    console.warn('💾 SaveManager initialized');
  }

  /**
   * Сохраняет игру.
   * @returns Promise<void>
   */
  public async save(): Promise<void> {
    console.warn('💾 SaveManager saved');
  }

  /**
   * Загружает игру.
   * @returns Promise<void>
   */
  public async load(): Promise<void> {
    console.warn('💾 SaveManager loaded');
  }

  /**
   * Автосохраняет игру.
   * @returns Promise<void>
   */
  public async autoSave(): Promise<void> {
    console.warn('💾 SaveManager auto saved');
  }

  /**
   * Сохраняет игру.
   * @param saveOptions SaveOptions
   * @returns Promise<void>
   */
  public async saveGame(saveOptions: SaveOptions): Promise<void> {
    console.warn('💾 SaveManager saved game', saveOptions);
    if (!this.core) {
      console.error('💾 SaveManager core not initialized');
      return;
    }
    if (!this.config) {
      console.error('💾 SaveManager config not initialized');
      return;
    }
    if (!this.eventBus) {
      console.error('💾 SaveManager eventBus not initialized');
      return;
    }

    const saveName = saveOptions.saveName || `Save ${new Date().toLocaleString()}`;
    const saveId = this.generateSaveId();

    try {
      const metadata: SaveMetadata = {
        version: SAVE_VERSION,
        gameVersion: '0.0.1',
        timestamp: Date.now(),
        saveName: saveName,
        playerName: this.config.playerName ?? 'player',
        playTime: 0,
      };

      const coreSaveData: CoreSaveData = this.serializeCoreState();
      const ecsSaveData: ECSData = this.serializeECSState();
      const moduleSaveData: ModuleData = this.serializeModuleState();

      const saveGame: SaveGame = {
        metadata: metadata,
        core: coreSaveData,
        ecs: ecsSaveData,
        module: moduleSaveData,
      };
    } catch (error) {
      console.error('💾 SaveManager error saving game', error);
      return;
    }
  }

  /**
   * Получение списка всех сохранений
   */
  public async getSavesList(): Promise<SaveMetadata[]> {
    const listJson = localStorage.getItem(STORAGE_KEY_LIST);
    if (!listJson) {
      return [];
    }

    try {
      const list = JSON.parse(listJson) as Record<string, SaveMetadata>;
      return Object.values(list);
    } catch (error) {
      console.error('Failed to parse saves list:', error);
      return [];
    }
  }

  // ==================== Приватные методы ====================

  /**
   * Генерирует уникальный идентификатор для сохранения.
   * @returns уникальный идентификатор для сохранения
   */
  private generateSaveId(): string {
    return `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  private serializeCoreState(): CoreSaveData {
    if (!this.core) throw new Error('Core not initialized');

    const tickManager = this.core.getTickManager();

    return {
      tickRate: tickManager.getTickRate(),
      currentTick: tickManager.getCurrentTick(),
      gameSpeed: tickManager.getSpeed(),
    };
  }

  /**
   * Сериализует состояние ECS.
   * @returns сериализованные данные ECS
   */
  private serializeECSState(): ECSData {
    if (!this.core) throw new Error('Core not initialized');

    const ecsManager = this.core.getECSManager();

    // получить все сущности
    const entities = ecsManager.getAllEntities();

    // получить все компоненты
    const serializedComponents: SerializedComponents = {};

    // сериализовать все компоненты
    for (const entityId of entities) {
      // получить все компоненты для сущности
      const entityComponents = ecsManager.getAllComponentsForEntity(entityId);

      // если сущность имеет компоненты, сериализовать их
      if (entityComponents.size > 0) {
        serializedComponents[entityId] = {};

        // сериализовать все компоненты
        for (const [componentType, componentData] of entityComponents) {
          // Преобразуем Symbol в строку
          const componentKey =
            typeof componentType === 'symbol' ? componentType.toString() : String(componentType);

          // сериализовать компонент
          serializedComponents[entityId][componentKey] = componentData;
        }
      }
    }

    // вернуть сериализованные данные
    return {
      entities: Array.from(entities),
      entityIdCounter: ecsManager.getEntityIdCounter(),
      components: serializedComponents,
    };
  }

  /**
   * Сериализует состояние Core.
   * @returns сериализованные данные Core
   */
  private serializeCoreSaveData(): CoreSaveData {
    if (!this.core) throw new Error('Core not initialized');

    const tickManager = this.core.getTickManager();

    return {
      tickRate: tickManager.getTickRate(),
      currentTick: tickManager.getCurrentTick(),
      gameSpeed: tickManager.getSpeed(),
    };
  }

  /**
   * Десериализует состояние Core.
   * @param state сериализованные данные Core
   */
  private deserializeCoreSaveData(state: CoreSaveData): void {
    if (!this.core) throw new Error('Core not initialized');

    const tickManager = this.core.getTickManager();
    tickManager.setSpeed(state.gameSpeed);
    // TODO: Восстановить currentTick если нужно
  }

  private serializeModuleState(): ModuleData {
    if (!this.core) throw new Error('Core not initialized');

    const moduleManager = this.core.getModuleManager();

    return {
      modules: moduleManager.getAllModules(),
    };
  }

  /**
   * Уничтожает SaveManager.
   */
  destroy(): void {
    console.warn('💾 SaveManager destroyed');
  }
}
