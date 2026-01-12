import { RegisteredSystem } from './system_registry';

/**
 * Метаданные кластера
 */
export interface ClusterMetadata {
  enabled: boolean;
  description?: string;
  interval?: number; // Интервал выполнения всего кластера
}

/**
 * Зарегистрированный кластер
 */
export interface RegisteredCluster {
  name: string;
  systemNames: string[];
  metadata: ClusterMetadata;
}

/**
 * Реестр кластеров систем
 */
export class ClusterRegistry {
  private static instance: ClusterRegistry;
  private clusters = new Map<string, RegisteredCluster>();

  private constructor() {}

  /**
   * Получить единственный экземпляр реестра (Singleton)
   */
  static getInstance(): ClusterRegistry {
    if (!ClusterRegistry.instance) {
      ClusterRegistry.instance = new ClusterRegistry();
    }
    return ClusterRegistry.instance;
  }

  /**
   * Зарегистрировать кластер в реестре
   * @param name Уникальное имя кластера
   * @param systemNames Массив имен систем в кластере
   * @param metadata Метаданные кластера
   */
  register(name: string, systemNames: string[], metadata: ClusterMetadata): void {
    if (this.clusters.has(name)) {
      throw new Error(`Cluster "${name}" is already registered`);
    }

    // Валидация
    if (!Array.isArray(systemNames) || systemNames.length === 0) {
      throw new Error(`Cluster "${name}": systemNames must be non-empty array`);
    }

    if (metadata.interval !== undefined && metadata.interval <= 0) {
      throw new Error(`Cluster "${name}": interval must be positive number`);
    }

    this.clusters.set(name, { name, systemNames, metadata });
  }

  /**
   * Автоматически создать кластеры на основе метаданных систем
   * @param registeredSystems Все зарегистрированные системы с метаданными
   */
  autoCreateFromSystemMetadata(registeredSystems: Map<string, RegisteredSystem>): void {
    const clusterMap = new Map<string, string[]>();

    // Группируем системы по кластерам
    for (const [systemName, registeredSystem] of registeredSystems) {
      const clusterName = registeredSystem.metadata.cluster;
      if (clusterName) {
        if (!clusterMap.has(clusterName)) {
          clusterMap.set(clusterName, []);
        }
        clusterMap.get(clusterName)!.push(systemName);
      }
    }

    // Создаем кластеры
    for (const [clusterName, systemNames] of clusterMap) {
      if (!this.clusters.has(clusterName)) {
        // Проверить, есть ли хотя бы одна включенная система в кластере
        const hasEnabledSystem = systemNames.some((systemName) => {
          const registeredSystem = registeredSystems.get(systemName);
          return registeredSystem && registeredSystem.metadata.enabled !== false;
        });

        this.register(clusterName, systemNames, {
          enabled: hasEnabledSystem,
          description: `Auto-created cluster for systems: ${systemNames.join(', ')}`,
        });
      }
    }
  }

  /**
   * Получить кластер по имени
   * @param name Имя кластера
   * @returns Зарегистрированный кластер или undefined
   */
  get(name: string): RegisteredCluster | undefined {
    return this.clusters.get(name);
  }

  /**
   * Получить все зарегистрированные кластеры
   * @returns Map с именами и зарегистрированными кластерами
   */
  getAll(): Map<string, RegisteredCluster> {
    return new Map(this.clusters);
  }

  /**
   * Проверить, зарегистрирован ли кластер
   * @param name Имя кластера
   * @returns true если кластер зарегистрирован
   */
  has(name: string): boolean {
    return this.clusters.has(name);
  }

  /**
   * Очистить реестр (для тестирования)
   */
  clear(): void {
    this.clusters.clear();
  }

  /**
   * Получить количество зарегистрированных кластеров
   */
  size(): number {
    return this.clusters.size;
  }
}
