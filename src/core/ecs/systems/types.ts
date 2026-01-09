import { World, EntityId } from 'bitecs';

/**
 * Dependencies для тестирования систем
 */
export interface ISystemDependencies {
  timeProvider?: {
    getCurrentTime(): number;
    getCurrentDay(): number;
    getMinutesOfDay(): number;
    getHourOfDay(): number;
  };
  randomProvider?: {
    random(): number;
    randomInt(min: number, max: number): number;
    shuffle<T>(array: T[]): T[];
  };
  logger?: {
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
  };
  eventBus?: {
    emit(event: string, payload?: any): void;
    on(event: string, handler: (payload?: any) => void): { unsubscribe: () => void };
  };
  gameConfig?: {
    pricesEntityId: EntityId;
    initialRentPrice: number;
    initialFoodPrice: number;
    priceUpdateIntervalDays: number;
  };
  componentManager?: {
    getPrices(eid: EntityId): any;
    setPrices(eid: EntityId, data: any): void;
  };
}

/**
 * Базовый интерфейс системы ECS
 */
export interface System {
  /** Название системы для отладки */
  name: string;
  /** Требуемые компоненты (массив строк с названиями) */
  components: readonly string[];
  /** Зависимости для тестирования (опционально) */
  dependencies?: ISystemDependencies;
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
