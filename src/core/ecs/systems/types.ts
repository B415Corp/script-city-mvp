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
  update: (
    world: World,
    entities: readonly EntityId[],
    delta?: number,
    extraData?: unknown,
  ) => void;
}

/**
 * Кластер систем - группа систем, выполняемых вместе
 */
export interface SystemCluster {
  /** Имена систем в кластере */
  systemNames: SystemName[];
  /** Интервал выполнения в секундах (undefined = каждый тик) */
  interval?: number;
  /** Включен ли кластер */
  enabled: boolean;
}

import { Events } from '../../event_bus/events';
import { EventPayload } from '../../event_bus/types';
import { SystemName } from '../ecs_manager';

/**
 * Event-driven система
 */
export interface EventDrivenSystem {
  /** Название системы */
  name: string;
  /** Название события для подписки */
  eventName: Events;
  /** Требуемые компоненты */
  components: readonly string[];
  /** Функция обновления */
  update: (world: World, entities: readonly EntityId[], eventData?: EventPayload<Events>) => void;
}
