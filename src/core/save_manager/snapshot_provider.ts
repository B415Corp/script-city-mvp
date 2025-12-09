/**
 * Интерфейс для провайдеров снапшотов.
 * Позволяет сериализовать и десериализовать состояние объектов с версионированием.
 *
 * Теги: `arch:core`, `arch:persistence`, `feature:save-load`
 */
export interface ISnapshotProvider<TSnapshot = any> {
  /**
   * Версия формата снапшота.
   * Используется для поддержки миграций при изменении формата данных.
   */
  readonly snapshotVersion: string;

  /**
   * Создает снапшот текущего состояния.
   * @returns сериализуемые данные состояния
   */
  createSnapshot(): TSnapshot;

  /**
   * Восстанавливает состояние из снапшота.
   * @param snapshot данные для восстановления
   * @param version версия формата снапшота
   */
  restoreFromSnapshot(snapshot: TSnapshot, version: string): void;

  /**
   * Проверяет совместимость снапшота с текущей версией.
   * @param version версия снапшота
   * @returns true если совместим, false если требуется миграция
   */
  isSnapshotCompatible(version: string): boolean;

  /**
   * Выполняет миграцию снапшота на новую версию.
   * @param snapshot старый снапшот
   * @param fromVersion версия старого снапшота
   * @returns новый снапшот в текущем формате
   */
  migrateSnapshot?(snapshot: any, fromVersion: string): TSnapshot;
}

/**
 * Базовый класс для провайдеров снапшотов с поддержкой версионирования.
 *
 * Теги: `arch:core`, `arch:persistence`, `feature:save-load`
 */
export abstract class BaseSnapshotProvider<TSnapshot = any> implements ISnapshotProvider<TSnapshot> {
  abstract readonly snapshotVersion: string;

  abstract createSnapshot(): TSnapshot;
  abstract restoreFromSnapshot(snapshot: TSnapshot, version: string): void;

  isSnapshotCompatible(version: string): boolean {
    return version === this.snapshotVersion;
  }

  migrateSnapshot?(snapshot: any, fromVersion: string): TSnapshot {
    // Базовая реализация - если версии совпадают, возвращаем как есть
    if (this.isSnapshotCompatible(fromVersion)) {
      return snapshot as TSnapshot;
    }

    throw new Error(
      `Snapshot migration required: ${fromVersion} -> ${this.snapshotVersion}. ` +
      'Override migrateSnapshot() to handle migrations.'
    );
  }
}
