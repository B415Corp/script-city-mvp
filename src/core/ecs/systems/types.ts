import { World, EntityId } from 'bitecs';

/**
 * Базовый интерфейс системы ECS
 */
export interface System {
  /** Название системы для отладки */
  name: string;
  /** Требуемые компоненты (массив строк с названиями) */
  components: readonly string[];
  /** Функция обновления системы */
  update: (world: World, entities: readonly EntityId[], delta?: number, extraData?: any) => void;
}

/**
 * Кластер систем - группа систем, выполняемых вместе
 */
export interface SystemCluster {
  /** Название кластера */
  name: string;
  /** Системы в кластере */
  systems: System[];
  /** Интервал выполнения (undefined = каждый тик) */
  interval?: number;
  /** Включен ли кластер */
  enabled: boolean;
}

/**
 * Event-driven система
 */
export interface EventDrivenSystem {
  /** Название системы */
  name: string;
  /** Название события для подписки */
  eventName: string;
  /** Требуемые компоненты */
  components: readonly string[];
  /** Функция обновления */
  update: (world: World, entities: readonly EntityId[], eventData?: any) => void;
}
