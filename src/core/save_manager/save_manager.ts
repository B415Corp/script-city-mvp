import { EventBus } from '../event_bus/event_bus';
import { GameCore } from '../game_core/game_core';
import { CoreConfig } from '../game_core/types';
import { IStorageProvider } from './storage/types';
import { IndexedDBStorageProvider } from './storage/indexeddb_storage_provider';
import { ISnapshotProvider } from './snapshot_provider';
import {
  CoreSaveData,
  ECSData,
  ModuleData,
  SaveGame,
  SaveMetadata,
  SaveOptions,
  SerializedComponents,
} from './types';
import { debugError, debugLog } from '@/infrastructure/utils/logger';

const SAVE_VERSION = '1.0.0'; // Версия формата сохранений

export class SaveManager {
  private core?: GameCore;
  private eventBus?: EventBus;
  private config?: CoreConfig;
  private storageProvider?: IStorageProvider;

  constructor() {
    debugLog('💾 SaveManager создан');
  }

  /**
   * Инициализирует SaveManager.
   * @param core GameCore
   * @param eventBus EventBus
   * @param storageProvider опциональный провайдер хранения (по умолчанию IndexedDB)
   */
  public async initialize(
    core: GameCore,
    eventBus: EventBus,
    storageProvider?: IStorageProvider,
  ): Promise<void> {
    this.core = core;
    this.eventBus = eventBus;
    this.config = core.getConfig();
    this.storageProvider = storageProvider || new IndexedDBStorageProvider();

    // Инициализируем провайдер хранения, если он поддерживает явную инициализацию
    if (this.storageProvider.initialize) {
      debugLog('💾 SaveManager: инициализация провайдера хранения');
      await this.storageProvider.initialize();
    }

    debugLog('💾 SaveManager инициализирован');
  }

  /**
   * Сохраняет игру (использует автосохранение).
   * @returns Promise<void>
   */
  public async save(): Promise<void> {
    debugLog('💾 SaveManager saving');
    await this.autoSave();
  }

  /**
   * Загружает игру по ID сохранения.
   * @param saveId ID сохранения для загрузки
   * @returns Promise<void>
   */
  public async load(saveId: string): Promise<void> {
    debugLog('💾 SaveManager loading game', { saveId });
    if (!this.core) {
      debugError('💾 SaveManager core not initialized', { core: this.core });
      return;
    }
    if (!this.eventBus) {
      debugError('💾 SaveManager eventBus not initialized', { eventBus: this.eventBus });
      return;
    }
    if (!this.storageProvider) {
      debugError('💾 SaveManager storage provider not initialized', {
        storageProvider: this.storageProvider,
      });
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

      debugLog(`💾 Game loaded successfully from save: ${saveId}`);
    } catch (error) {
      debugError('💾 SaveManager error loading game', { error });
      throw error;
    }
  }

  /**
   * Автосохраняет игру.
   * @returns Promise<void>
   */
  public async autoSave(): Promise<void> {
    debugLog('💾 SaveManager auto saving');
    if (!this.storageProvider) {
      debugError('💾 SaveManager storage provider not initialized', {
        storageProvider: this.storageProvider,
      });
      return;
    }

    try {
      await this.saveGame({
        saveName: 'AutoSave',
        autoSave: true,
      });
      debugLog('💾 Auto save completed');
    } catch (error) {
      debugError('💾 Auto save failed:', { error });
      throw error;
    }
  }

  /**
   * Сохраняет игру.
   * @param saveOptions SaveOptions
   * @returns Promise<void>
   */
  public async saveGame(saveOptions: SaveOptions): Promise<void> {
    debugLog('💾 SaveManager saved game', { saveOptions });
    if (!this.core) {
      debugError('💾 SaveManager core not initialized', { core: this.core });
      return;
    }
    if (!this.config) {
      debugError('💾 SaveManager config not initialized', { config: this.config });
      return;
    }
    if (!this.eventBus) {
      debugError('💾 SaveManager eventBus not initialized', { eventBus: this.eventBus });
      return;
    }
    if (!this.storageProvider) {
      debugError('💾 SaveManager storage provider not initialized', {
        storageProvider: this.storageProvider,
      });
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

      // Отладка: проверяем что данные можно сериализовать
      if (this.config?.enableDebug) {
        debugLog('💾 SaveManager: saveGame structure:', {
          metadata: Object.keys(metadata),
          coreKeys: Object.keys(coreSaveData),
          ecsEntitiesCount: ecsSaveData.entities.length,
          moduleKeys: Object.keys(moduleSaveData),
        });
      }

      await this.storageProvider.saveGame(saveId, saveGame);
      debugLog(`💾 Game saved successfully with ID: ${saveId}`);
    } catch (error) {
      debugError('💾 SaveManager error saving game', { error });
      throw error;
    }
  }

  /**
   * Получение списка всех сохранений
   */
  public async getSavesList(): Promise<SaveMetadata[]> {
    if (!this.storageProvider) {
      debugError('💾 SaveManager storage provider not initialized', {
        storageProvider: this.storageProvider,
      });
      return [];
    }

    try {
      return await this.storageProvider.getSavesList();
    } catch (error) {
      debugError('Failed to get saves list:', { error });
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

    const ecsManager = this.core.getECSManager() as ISnapshotProvider<ECSData>;
    return ecsManager.createSnapshot();
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

    const ecsManager = this.core.getECSManager() as ISnapshotProvider<ECSData>;
    ecsManager.restoreFromSnapshot(state, SAVE_VERSION);
  }

  /**
   * Десериализует состояние модулей.
   * @param state сериализованные данные модулей
   */
  private deserializeModuleState(state: ModuleData): void {
    if (!this.core) throw new Error('Core not initialized');

    const moduleManager = this.core.getModuleManager();

    // Восстанавливаем данные для каждого модуля
    for (const moduleId of Object.keys(state)) {
      const moduleState = state[moduleId];
      const module = moduleManager.getModule(moduleId);
      if (module !== null) {
        const snapshotProvider = module as ISnapshotProvider;
        if (snapshotProvider.restoreFromSnapshot) {
          try {
            const hasVersionedState =
              typeof moduleState === 'object' &&
              moduleState !== null &&
              'data' in moduleState &&
              'version' in moduleState;

            const data = hasVersionedState ? (moduleState as { data: unknown }).data : moduleState;
            const version = hasVersionedState
              ? (moduleState as { version: string }).version
              : '1.0.0';

            snapshotProvider.restoreFromSnapshot(data, version);
            debugLog(`💾 SaveManager: восстановлен модуль "${moduleId}"`);
          } catch (error) {
            debugLog(`💾 SaveManager: ошибка восстановления модуля "${moduleId}"`, { error });
          }
        }
      } else {
        debugLog(`💾 SaveManager: модуль "${moduleId}" не найден при загрузке сохранения`);
      }
    }
  }

  /**
   * Сериализует состояние модулей.
   * @returns сериализованные данные модулей
   */
  private serializeModuleState(): ModuleData {
    if (!this.core) throw new Error('Core not initialized');

    const moduleManager = this.core.getModuleManager();
    const modules = moduleManager.getAllModules();
    const moduleData: ModuleData = {};

    // Сериализуем только те модули, которые реализуют ISnapshotProvider
    for (const module of modules) {
      const snapshotProvider = module as ISnapshotProvider;
      if (snapshotProvider.createSnapshot && snapshotProvider.snapshotVersion) {
        try {
          const data = snapshotProvider.createSnapshot();
          // Проверяем, что данные можно сериализовать через JSON
          moduleData[module.id] = {
            version: snapshotProvider.snapshotVersion,
            data: JSON.parse(JSON.stringify(data)),
          };
          debugLog(`💾 SaveManager: сериализован модуль "${module.id}"`);
        } catch (error) {
          debugLog(`💾 SaveManager: не удалось сериализовать модуль "${module.id}"`, { error });
        }
      }
    }

    return moduleData;
  }

  /**
   * Удаляет сохранение по ID.
   * @param saveId ID сохранения для удаления
   */
  public async deleteSave(saveId: string): Promise<void> {
    if (!this.storageProvider) {
      debugError('💾 SaveManager storage provider not initialized', {
        storageProvider: this.storageProvider,
      });
      return;
    }

    try {
      await this.storageProvider.deleteGame(saveId);
      debugLog(`💾 Save deleted: ${saveId}`);
    } catch (error) {
      debugError('💾 Failed to delete save:', { error });
      throw error;
    }
  }

  /**
   * Проверяет существует ли сохранение.
   * @param saveId ID сохранения для проверки
   */
  public async saveExists(saveId: string): Promise<boolean> {
    if (!this.storageProvider) {
      debugError('💾 SaveManager storage provider not initialized', {
        storageProvider: this.storageProvider,
      });
      return false;
    }

    try {
      return await this.storageProvider.exists(saveId);
    } catch (error) {
      debugError('💾 Failed to check save existence:', { error });
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
    debugLog('💾 SaveManager destroyed');
  }
}
