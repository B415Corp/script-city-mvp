import { SaveGame, SaveMetadata } from '../types';

/**
 * Интерфейс для провайдера хранения данных.
 * Позволяет абстрагировать способ хранения (IndexedDB, localStorage, file system и т.д.)
 */
export interface IStorageProvider {
  /**
   * Сохраняет игру по указанному ID
   * @param saveId уникальный идентификатор сохранения
   * @param saveGame данные для сохранения
   */
  saveGame(saveId: string, saveGame: SaveGame): Promise<void>;

  /**
   * Загружает игру по указанному ID
   * @param saveId уникальный идентификатор сохранения
   * @returns данные сохраненной игры или null если не найдено
   */
  loadGame(saveId: string): Promise<SaveGame | null>;

  /**
   * Удаляет сохранение по ID
   * @param saveId уникальный идентификатор сохранения
   */
  deleteGame(saveId: string): Promise<void>;

  /**
   * Возвращает список всех сохранений
   * @returns массив метаданных всех сохранений
   */
  getSavesList(): Promise<SaveMetadata[]>;

  /**
   * Проверяет существует ли сохранение
   * @param saveId уникальный идентификатор сохранения
   */
  exists(saveId: string): Promise<boolean>;

  /**
   * Очищает все данные хранилища
   */
  clear(): Promise<void>;
}
