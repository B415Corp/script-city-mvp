import Phaser from 'phaser';
import { ECSManager } from '../ecs_manager/ecs_manager';
import { ISystem } from '../ecs_manager/types';
import { GameCore } from '../game_core/game_core';
import { ISnapshotProvider } from '../save_manager/snapshot_provider';

/**
 * Интерфейс для модулей симуляции.
 *
 * **Теги**: `arch:module`, `arch:core`
 *
 * Модуль представляет собой изолированную функциональную единицу игры,
 * которая может регистрировать системы, подписываться на события и
 * взаимодействовать с ядром через публичный API.
 *
 * Модули, которые хотят участвовать в сохранении/загрузке, должны реализовывать ISnapshotProvider.
 */
export interface IModule extends Partial<ISnapshotProvider> {
  /**
   * Уникальный идентификатор модуля.
   * Используется для регистрации, поиска и управления зависимостями.
   */
  id: string;

  /**
   * Список ID модулей-зависимостей.
   * Модули из этого списка будут инициализированы раньше данного модуля.
   */
  dependencies?: string[];

  /**
   * Инициализация модуля.
   * Вызывается один раз при запуске игры, после инициализации всех зависимостей.
   *
   * @param core - экземпляр GameCore для доступа к менеджерам
   */
  initialize(core: GameCore): Promise<void>;

  /**
   * Очистка модуля.
   * Вызывается при остановке игры или удалении модуля.
   */
  destroy(): void;

  /**
   * Присоединение модуля к Phaser сцене.
   * Опциональный метод для модулей, которые взаимодействуют с UI/рендерингом.
   *
   * @param scene - Phaser сцена для присоединения модуля
   */
  attachToScene?(scene: Phaser.Scene): void;

  /**
   * Регистрация систем модуля в ECSManager.
   * Вызывается после инициализации модуля, если метод определен.
   *
   * @param ecs - экземпляр ECSManager для регистрации систем
   */
  registerSystems?(ecs: ECSManager): void;

  /**
   * Набор систем ECS, которые модуль регистрирует автоматически.
   * При наличии массива ModuleManager сам вызовет ecs.registerSystem(...)
   * после initialize().
   */
  ecsSystems?: ISystem[];
}

/**
 * Внутренняя структура для хранения информации о модуле.
 */
export interface ModuleEntry {
  module: IModule;
  dependencies: string[];
  initialized: boolean;
}
