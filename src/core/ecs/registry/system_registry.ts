import { SystemFunction } from '../core/smart_constructors';

/**
 * Метаданные системы для автоматической регистрации
 */
export interface SystemMetadata {
  name?: string; // Имя системы (добавляется автоматически в createSystem)
  cluster?: string; // Кластер принадлежности
  interval?: number; // Интервал выполнения (в тиках)
  eventTriggers?: string[]; // События-триггеры
  enabled?: boolean; // Включена по умолчанию
  dependencies?: Record<string, unknown>; // Зависимости для создания
}

/**
 * Зарегистрированная система с метаданными
 */
export interface RegisteredSystem {
  name: string;
  system: SystemFunction;
  metadata: SystemMetadata;
}

/**
 * Реестр всех систем ECS с метаданными
 */
export class SystemRegistry {
  private static instance: SystemRegistry;
  private systems = new Map<string, RegisteredSystem>();

  private constructor() {}

  /**
   * Получить единственный экземпляр реестра (Singleton)
   */
  static getInstance(): SystemRegistry {
    if (!SystemRegistry.instance) {
      SystemRegistry.instance = new SystemRegistry();
    }
    return SystemRegistry.instance;
  }

  /**
   * Зарегистрировать систему в реестре
   * @param name Уникальное имя системы
   * @param system Функция системы
   * @param metadata Метаданные системы
   */
  register(name: string, system: SystemFunction, metadata: SystemMetadata): void {
    if (this.systems.has(name)) {
      throw new Error(`System "${name}" is already registered`);
    }

    // Валидация метаданных
    if (metadata.interval !== undefined && metadata.interval <= 0) {
      throw new Error(`System "${name}": interval must be positive number`);
    }

    this.systems.set(name, { name, system, metadata });
  }

  /**
   * Получить систему по имени
   * @param name Имя системы
   * @returns Зарегистрированная система или undefined
   */
  get(name: string): RegisteredSystem | undefined {
    return this.systems.get(name);
  }

  /**
   * Получить все зарегистрированные системы
   * @returns Map с именами и зарегистрированными системами
   */
  getAll(): Map<string, RegisteredSystem> {
    return new Map(this.systems);
  }

  /**
   * Получить системы по кластеру
   * @param clusterName Имя кластера
   * @returns Массив зарегистрированных систем
   */
  getSystemsByCluster(clusterName: string): RegisteredSystem[] {
    const result: RegisteredSystem[] = [];
    for (const registeredSystem of this.systems.values()) {
      if (registeredSystem.metadata.cluster === clusterName) {
        result.push(registeredSystem);
      }
    }
    return result;
  }

  /**
   * Получить интервальные системы
   * @returns Массив зарегистрированных систем с интервалами
   */
  getIntervalSystems(): RegisteredSystem[] {
    const result: RegisteredSystem[] = [];
    for (const registeredSystem of this.systems.values()) {
      if (registeredSystem.metadata.interval !== undefined) {
        result.push(registeredSystem);
      }
    }
    return result;
  }

  /**
   * Получить event-driven системы
   * @returns Массив зарегистрированных систем с событиями-триггерами
   */
  getEventDrivenSystems(): RegisteredSystem[] {
    const result: RegisteredSystem[] = [];
    for (const registeredSystem of this.systems.values()) {
      if (
        registeredSystem.metadata.eventTriggers &&
        registeredSystem.metadata.eventTriggers.length > 0
      ) {
        result.push(registeredSystem);
      }
    }
    return result;
  }

  /**
   * Проверить, зарегистрирована ли система
   * @param name Имя системы
   * @returns true если система зарегистрирована
   */
  has(name: string): boolean {
    return this.systems.has(name);
  }

  /**
   * Очистить реестр (для тестирования)
   */
  clear(): void {
    this.systems.clear();
  }

  /**
   * Получить количество зарегистрированных систем
   */
  size(): number {
    return this.systems.size;
  }
}
