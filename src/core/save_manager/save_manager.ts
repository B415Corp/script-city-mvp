import { EventBus } from '../event_bus/event_bus';
import { GameCore } from '../game_core/game_core';
import { CoreConfig } from '../game_core/types';
import { IStorageProvider } from './storage/types';
import { IndexedDBStorageProvider } from './storage/indexeddb_storage_provider';
import {
  CoreSaveData,
  ECSData,
  ModuleData,
  SaveGame,
  SaveMetadata,
  SaveOptions,
  SerializedComponents,
} from './types';

const SAVE_VERSION = '1.0.0'; // Версия формата сохранений

export class SaveManager {
  private core?: GameCore;
  private eventBus?: EventBus;
  private config?: CoreConfig;
  private storageProvider?: IStorageProvider;

  constructor() {
    console.warn('💾 SaveManager initialized');
  }

  /**
   * Инициализирует SaveManager.
   * @param core GameCore
   * @param eventBus EventBus
   * @param storageProvider опциональный провайдер хранения (по умолчанию IndexedDB)
   */
  public initialize(core: GameCore, eventBus: EventBus, storageProvider?: IStorageProvider): void {
    this.core = core;
    this.eventBus = eventBus;
    this.config = core.getConfig();
    this.storageProvider = storageProvider || new IndexedDBStorageProvider();
    console.warn('💾 SaveManager initialized');
  }

  /**
   * Сохраняет игру (использует автосохранение).
   * @returns Promise<void>
   */
  public async save(): Promise<void> {
    console.warn('💾 SaveManager saving');
    await this.autoSave();
  }

  /**
   * Загружает игру по ID сохранения.
   * @param saveId ID сохранения для загрузки
   * @returns Promise<void>
   */
  public async load(saveId: string): Promise<void> {
    console.warn('💾 SaveManager loading game', saveId);
    if (!this.core) {
      console.error('💾 SaveManager core not initialized');
      return;
    }
    if (!this.eventBus) {
      console.error('💾 SaveManager eventBus not initialized');
      return;
    }
    if (!this.storageProvider) {
      console.error('💾 SaveManager storage provider not initialized');
      return;
    }

    try {
      const saveGame = await this.storageProvider.loadGame(saveId);
      if (!saveGame) {
        throw new Error(`Save with ID ${saveId} not found`);
      }

      // Восстанавливаем состояние в обратном порядке
      this.deserializeModuleState(saveGame.module);
      this.deserializeECSState(saveGame.ecs);
      this.deserializeCoreState(saveGame.core);

      console.warn(`💾 Game loaded successfully from save: ${saveId}`);
    } catch (error) {
      console.error('💾 SaveManager error loading game', error);
      throw error;
    }
  }

  /**
   * Автосохраняет игру.
   * @returns Promise<void>
   */
  public async autoSave(): Promise<void> {
    console.warn('💾 SaveManager auto saving');
    if (!this.storageProvider) {
      console.error('💾 SaveManager storage provider not initialized');
      return;
    }

    try {
      await this.saveGame({
        saveName: 'AutoSave',
        autoSave: true,
      });
      console.warn('💾 Auto save completed');
    } catch (error) {
      console.error('💾 Auto save failed:', error);
      throw error;
    }
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
    if (!this.storageProvider) {
      console.error('💾 SaveManager storage provider not initialized');
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

      await this.storageProvider.saveGame(saveId, saveGame);
      console.warn(`💾 Game saved successfully with ID: ${saveId}`);
    } catch (error) {
      console.error('💾 SaveManager error saving game', error);
      throw error;
    }
  }

  /**
   * Получение списка всех сохранений
   */
  public async getSavesList(): Promise<SaveMetadata[]> {
    if (!this.storageProvider) {
      console.error('💾 SaveManager storage provider not initialized');
      return [];
    }

    try {
      return await this.storageProvider.getSavesList();
    } catch (error) {
      console.error('Failed to get saves list:', error);
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
   * Десериализует состояние Core.
   * @param state сериализованные данные Core
   */
  private deserializeCoreState(state: CoreSaveData): void {
    if (!this.core) throw new Error('Core not initialized');

    const tickManager = this.core.getTickManager();
    tickManager.setSpeed(state.gameSpeed);
    // TODO: Восстановить currentTick если нужно
  }

  /**
   * Десериализует состояние ECS.
   * @param state сериализованные данные ECS
   */
  private deserializeECSState(state: ECSData): void {
    if (!this.core) throw new Error('Core not initialized');

    const ecsManager = this.core.getECSManager();

    // Очищаем текущее состояние ECS
    ecsManager.clear();

    // Восстанавливаем счетчик ID сущностей
    ecsManager.setEntityIdCounter(state.entityIdCounter);

    // Восстанавливаем компоненты для каждой сущности
    for (const entityId of state.entities) {
      const entityComponents = state.components[entityId.toString()];
      if (entityComponents) {
        for (const [componentType, componentData] of Object.entries(entityComponents)) {
          // Преобразуем строку обратно в Symbol если нужно
          const componentKey: string | symbol = componentType.startsWith('Symbol(')
            ? Symbol(componentType.slice(7, -1))
            : componentType;

          ecsManager.addComponent(entityId, componentData, componentKey);
        }
      }
    }
  }

  /**
   * Десериализует состояние модулей.
   * @param state сериализованные данные модулей
   */
  private deserializeModuleState(state: ModuleData): void {
    if (!this.core) throw new Error('Core not initialized');

    // TODO: Реализовать восстановление состояния модулей
    // Пока просто логируем для отладки
    console.warn('💾 Deserializing module state:', state);
  }

  private serializeModuleState(): ModuleData {
    if (!this.core) throw new Error('Core not initialized');

    const moduleManager = this.core.getModuleManager();

    return {
      modules: moduleManager.getAllModules(),
    };
  }

  /**
   * Удаляет сохранение по ID.
   * @param saveId ID сохранения для удаления
   */
  public async deleteSave(saveId: string): Promise<void> {
    if (!this.storageProvider) {
      console.error('💾 SaveManager storage provider not initialized');
      return;
    }

    try {
      await this.storageProvider.deleteGame(saveId);
      console.warn(`💾 Save deleted: ${saveId}`);
    } catch (error) {
      console.error('💾 Failed to delete save:', error);
      throw error;
    }
  }

  /**
   * Проверяет существует ли сохранение.
   * @param saveId ID сохранения для проверки
   */
  public async saveExists(saveId: string): Promise<boolean> {
    if (!this.storageProvider) {
      console.error('💾 SaveManager storage provider not initialized');
      return false;
    }

    try {
      return await this.storageProvider.exists(saveId);
    } catch (error) {
      console.error('💾 Failed to check save existence:', error);
      return false;
    }
  }

  /**
   * Уничтожает SaveManager.
   */
  destroy(): void {
    // Закрываем соединение если провайдер поддерживает это (IndexedDB)
    if (this.storageProvider && 'close' in this.storageProvider) {
      (this.storageProvider as IndexedDBStorageProvider).close();
    }
    console.warn('💾 SaveManager destroyed');
  }
}
