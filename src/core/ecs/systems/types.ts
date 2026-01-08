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
  systemNames: string[];
  /** Интервал выполнения в секундах (undefined = каждый тик) */
  interval?: number;
  /** Включен ли кластер */
  enabled: boolean;
}

// Event-driven системы теперь работают через событие CallSystem
// Вместо специального интерфейса используются обычные System
// SystemName теперь просто string
