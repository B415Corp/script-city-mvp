import { EventBus } from '../event_bus/event_bus';
import { ECSManager } from './ecs_manager';

/**
 * Идентификатор сущности.
 * Может быть числом или строкой.
 */
export type EntityId = number | string;

/**
 * Тип компонента.
 * Может быть строкой или символом.
 */
export type ComponentType = string | symbol;

/**
 * Интерфейс для систем ECS.
 *
 * Системы обрабатывают сущности с определёнными компонентами
 * и выполняют игровую логику.
 */
export interface ISystem {
  /** Уникальный идентификатор системы */
  id: string;

  /** Приоритет выполнения (меньше = выше приоритет) */
  priority: number;

  /** Интервал обновления в тиках (1 = каждый тик) */
  updateInterval: number;

  /**
   * Метод обновления системы.
   *
   * @param deltaTime - Время, прошедшее с последнего обновления (в тиках)
   * @param ecs - Менеджер ECS для доступа к сущностям и компонентам
   * @param eventBus - Событийная шина для публикации событий
   */

  update(deltaTime: number, ecs: ECSManager, eventBus: EventBus): void;
}
