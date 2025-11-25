declare const indexedDB: IDBFactory;

import { IStorageProvider } from './types';
import { SaveGame, SaveMetadata } from '../types';

const DB_NAME = 'script_city_saves';
const DB_VERSION = 1;
const SAVES_STORE = 'saves';
const METADATA_STORE = 'metadata';

/**
 * Реализация IStorageProvider для хранения данных в IndexedDB
 */
export class IndexedDBStorageProvider implements IStorageProvider {
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  /**
   * Инициализирует IndexedDB базу данных
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (): void => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = (): void => {
        this.db = request.result;
        console.warn('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event): void => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Создаем object store для сохранений
        if (!db.objectStoreNames.contains(SAVES_STORE)) {
          db.createObjectStore(SAVES_STORE, { keyPath: 'saveId' });
        }

        // Создаем object store для метаданных (для быстрого доступа)
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'saveId' });
        }
      };
    });
  }

  /**
   * Убеждается что БД инициализирована
   */
  private async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }
  }

  /**
   * Сохраняет игру по указанному ID
   */
  async saveGame(saveId: string, saveGame: SaveGame): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([SAVES_STORE, METADATA_STORE], 'readwrite');

    return new Promise((resolve, reject) => {
      // Сохраняем полные данные игры
      const saveRequest = transaction.objectStore(SAVES_STORE).put({
        saveId,
        ...saveGame,
      });

      saveRequest.onerror = (): void => reject(saveRequest.error);

      // Сохраняем метаданные отдельно для быстрого доступа
      const metadataRequest = transaction.objectStore(METADATA_STORE).put({
        saveId,
        ...saveGame.metadata,
      });

      metadataRequest.onerror = (): void => reject(metadataRequest.error);

      transaction.oncomplete = (): void => resolve();
      transaction.onerror = (): void => reject(transaction.error);
    });
  }

  /**
   * Загружает игру по указанному ID
   */
  async loadGame(saveId: string): Promise<SaveGame | null> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const request = this.db!.transaction(SAVES_STORE).objectStore(SAVES_STORE).get(saveId);

      request.onsuccess = (): void => {
        if (request.result) {
          const saveGame = { ...request.result };
          delete saveGame.saveId;
          resolve(saveGame as SaveGame);
        } else {
          resolve(null);
        }
      };

      request.onerror = (): void => reject(request.error);
    });
  }

  /**
   * Удаляет сохранение по ID
   */
  async deleteGame(saveId: string): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([SAVES_STORE, METADATA_STORE], 'readwrite');

    return new Promise((resolve, reject) => {
      // Удаляем из основного хранилища
      const saveRequest = transaction.objectStore(SAVES_STORE).delete(saveId);
      saveRequest.onerror = (): void => reject(saveRequest.error);

      // Удаляем из метаданных
      const metadataRequest = transaction.objectStore(METADATA_STORE).delete(saveId);
      metadataRequest.onerror = (): void => reject(metadataRequest.error);

      transaction.oncomplete = (): void => resolve();
      transaction.onerror = (): void => reject(transaction.error);
    });
  }

  /**
   * Возвращает список всех сохранений
   */
  async getSavesList(): Promise<SaveMetadata[]> {
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
        resolve(metadataList);
      };

      request.onerror = (): void => reject(request.error);
    });
  }

  /**
   * Проверяет существует ли сохранение
   */
  async exists(saveId: string): Promise<boolean> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const request = this.db!.transaction(SAVES_STORE).objectStore(SAVES_STORE).getKey(saveId);

      request.onsuccess = (): void => resolve(!!request.result);
      request.onerror = (): void => reject(request.error);
    });
  }

  /**
   * Очищает все данные хранилища
   */
  async clear(): Promise<void> {
    await this.ensureDB();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([SAVES_STORE, METADATA_STORE], 'readwrite');

    return new Promise((resolve, reject) => {
      // Очищаем основное хранилище
      const saveRequest = transaction.objectStore(SAVES_STORE).clear();
      saveRequest.onerror = (): void => reject(saveRequest.error);

      // Очищаем метаданные
      const metadataRequest = transaction.objectStore(METADATA_STORE).clear();
      metadataRequest.onerror = (): void => reject(metadataRequest.error);

      transaction.oncomplete = (): void => resolve();
      transaction.onerror = (): void => reject(transaction.error);
    });
  }

  /**
   * Закрывает соединение с базой данных
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
