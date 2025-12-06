declare const indexedDB: IDBFactory;

import { IStorageProvider } from './types';
import { SaveGame, SaveMetadata } from '../types';
import { debugError, debugLog, debugWarn } from '@/infrastructure/utils/logger';

const DB_NAME = 'script_city_saves';
const DB_VERSION = 1;
const SAVES_STORE = 'saves';
const METADATA_STORE = 'metadata';

/**
 * Реализация IStorageProvider для хранения данных в IndexedDB
 */
export class IndexedDBStorageProvider implements IStorageProvider {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Не инициализируем БД в конструкторе, ждём явного вызова initialize()
  }

  /**
   * Явно инициализирует IndexedDB базу данных.
   * Должен быть вызван перед использованием провайдера.
   */
  public async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = this.initDB();
    return this.initPromise;
  }

  /**
   * Инициализирует IndexedDB базу данных
   */
  private async initDB(): Promise<void> {
    debugLog('IndexedDB: начата инициализация', { dbName: DB_NAME, version: DB_VERSION });
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (): void => {
        debugError('IndexedDB: ошибка при открытии базы данных', {
          error: request.error,
          dbName: DB_NAME,
        });
        reject(request.error);
      };

      request.onsuccess = (): void => {
        this.db = request.result;
        debugLog('IndexedDB: база данных успешно инициализирована', {
          dbName: DB_NAME,
          version: DB_VERSION,
          objectStores: Array.from(this.db.objectStoreNames),
        });
        resolve();
      };

      request.onupgradeneeded = (event): void => {
        const db = (event.target as IDBOpenDBRequest).result;
        debugLog('IndexedDB: выполняется обновление схемы базы данных', {
          oldVersion: event.oldVersion,
          newVersion: event.newVersion,
        });

        // Создаем object store для сохранений
        if (!db.objectStoreNames.contains(SAVES_STORE)) {
          db.createObjectStore(SAVES_STORE, { keyPath: 'saveId' });
          debugLog('IndexedDB: создан object store', { storeName: SAVES_STORE });
        }

        // Создаем object store для метаданных (для быстрого доступа)
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'saveId' });
          debugLog('IndexedDB: создан object store', { storeName: METADATA_STORE });
        }
      };
    });
  }

  /**
   * Убеждается что БД инициализирована
   */
  private async ensureDB(): Promise<void> {
    if (!this.db) {
      if (!this.initPromise) {
        debugWarn(
          'IndexedDB: база данных не инициализирована, выполняется инициализация (должна была быть вызвана initialize())',
        );
        await this.initialize();
      } else {
        await this.initPromise;
      }
    }
  }

  /**
   * Сохраняет игру по указанному ID
   */
  async saveGame(saveId: string, saveGame: SaveGame): Promise<void> {
    debugLog('IndexedDB: начало сохранения игры', { saveId, metadata: saveGame.metadata });
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([SAVES_STORE, METADATA_STORE], 'readwrite');

    return new Promise((resolve, reject) => {
      // Сохраняем полные данные игры
      const saveRequest = transaction.objectStore(SAVES_STORE).put({
        saveId,
        ...saveGame,
      });

      saveRequest.onerror = (): void => {
        debugError('IndexedDB: ошибка при сохранении игры', { saveId, error: saveRequest.error });
        reject(saveRequest.error);
      };

      // Сохраняем метаданные отдельно для быстрого доступа
      const metadataRequest = transaction.objectStore(METADATA_STORE).put({
        saveId,
        ...saveGame.metadata,
      });

      metadataRequest.onerror = (): void => {
        debugError('IndexedDB: ошибка при сохранении метаданных', {
          saveId,
          error: metadataRequest.error,
        });
        reject(metadataRequest.error);
      };

      transaction.oncomplete = (): void => {
        debugLog('IndexedDB: игра успешно сохранена', { saveId });
        resolve();
      };
      transaction.onerror = (): void => {
        debugError('IndexedDB: ошибка транзакции при сохранении', {
          saveId,
          error: transaction.error,
        });
        reject(transaction.error);
      };
    });
  }

  /**
   * Загружает игру по указанному ID
   */
  async loadGame(saveId: string): Promise<SaveGame | null> {
    debugLog('IndexedDB: начало загрузки игры', { saveId });
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const request = this.db!.transaction(SAVES_STORE).objectStore(SAVES_STORE).get(saveId);

      request.onsuccess = (): void => {
        if (request.result) {
          const saveGame = { ...request.result };
          delete saveGame.saveId;
          debugLog('IndexedDB: игра успешно загружена', { saveId, metadata: saveGame.metadata });
          resolve(saveGame as SaveGame);
        } else {
          debugWarn('IndexedDB: игра не найдена', { saveId });
          resolve(null);
        }
      };

      request.onerror = (): void => {
        debugError('IndexedDB: ошибка при загрузке игры', { saveId, error: request.error });
        reject(request.error);
      };
    });
  }

  /**
   * Удаляет сохранение по ID
   */
  async deleteGame(saveId: string): Promise<void> {
    debugLog('IndexedDB: начало удаления игры', { saveId });
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([SAVES_STORE, METADATA_STORE], 'readwrite');

    return new Promise((resolve, reject) => {
      // Удаляем из основного хранилища
      const saveRequest = transaction.objectStore(SAVES_STORE).delete(saveId);
      saveRequest.onerror = (): void => {
        debugError('IndexedDB: ошибка при удалении игры из основного хранилища', {
          saveId,
          error: saveRequest.error,
        });
        reject(saveRequest.error);
      };

      // Удаляем из метаданных
      const metadataRequest = transaction.objectStore(METADATA_STORE).delete(saveId);
      metadataRequest.onerror = (): void => {
        debugError('IndexedDB: ошибка при удалении метаданных', {
          saveId,
          error: metadataRequest.error,
        });
        reject(metadataRequest.error);
      };

      transaction.oncomplete = (): void => {
        debugLog('IndexedDB: игра успешно удалена', { saveId });
        resolve();
      };
      transaction.onerror = (): void => {
        debugError('IndexedDB: ошибка транзакции при удалении', {
          saveId,
          error: transaction.error,
        });
        reject(transaction.error);
      };
    });
  }

  /**
   * Возвращает список всех сохранений
   */
  async getSavesList(): Promise<SaveMetadata[]> {
    debugLog('IndexedDB: начало получения списка сохранений');
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const request = this.db!.transaction(METADATA_STORE).objectStore(METADATA_STORE).getAll();

      request.onsuccess = (): void => {
        const metadataList: SaveMetadata[] = [];
        for (const item of request.result) {
          const metadata = { ...item };
          delete metadata.saveId;
          metadataList.push(metadata as SaveMetadata);
        }
        debugLog('IndexedDB: список сохранений получен', { count: metadataList.length });
        resolve(metadataList);
      };

      request.onerror = (): void => {
        debugError('IndexedDB: ошибка при получении списка сохранений', { error: request.error });
        reject(request.error);
      };
    });
  }

  /**
   * Проверяет существует ли сохранение
   */
  async exists(saveId: string): Promise<boolean> {
    debugLog('IndexedDB: проверка существования сохранения', { saveId });
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const request = this.db!.transaction(SAVES_STORE).objectStore(SAVES_STORE).getKey(saveId);

      request.onsuccess = (): void => {
        const exists = !!request.result;
        debugLog('IndexedDB: проверка существования завершена', { saveId, exists });
        resolve(exists);
      };
      request.onerror = (): void => {
        debugError('IndexedDB: ошибка при проверке существования', {
          saveId,
          error: request.error,
        });
        reject(request.error);
      };
    });
  }

  /**
   * Очищает все данные хранилища
   */
  async clear(): Promise<void> {
    debugWarn('IndexedDB: начало очистки всех данных хранилища');
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([SAVES_STORE, METADATA_STORE], 'readwrite');

    return new Promise((resolve, reject) => {
      // Очищаем основное хранилище
      const saveRequest = transaction.objectStore(SAVES_STORE).clear();
      saveRequest.onerror = (): void => {
        debugError('IndexedDB: ошибка при очистке основного хранилища', {
          error: saveRequest.error,
        });
        reject(saveRequest.error);
      };

      // Очищаем метаданные
      const metadataRequest = transaction.objectStore(METADATA_STORE).clear();
      metadataRequest.onerror = (): void => {
        debugError('IndexedDB: ошибка при очистке метаданных', { error: metadataRequest.error });
        reject(metadataRequest.error);
      };

      transaction.oncomplete = (): void => {
        debugLog('IndexedDB: все данные хранилища успешно очищены');
        resolve();
      };
      transaction.onerror = (): void => {
        debugError('IndexedDB: ошибка транзакции при очистке', { error: transaction.error });
        reject(transaction.error);
      };
    });
  }

  /**
   * Закрывает соединение с базой данных
   */
  close(): void {
    if (this.db) {
      debugLog('IndexedDB: закрытие соединения с базой данных', { dbName: DB_NAME });
      this.db.close();
      this.db = null;
    } else {
      debugLog('IndexedDB: соединение уже закрыто');
    }
  }
}
