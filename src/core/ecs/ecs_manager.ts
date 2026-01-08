import { createWorld, addEntity, removeEntity, World, EntityId, query } from 'bitecs';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { CallSystemPayload } from '../event_bus/types';

import { EntityFactory } from './entities';
import { PopulationSystem, NeedsSystem, DailyRoutineSystem } from './systems/clusters';
import { System, SystemCluster } from './systems/types';
import { LogicTickData } from '../tick/types';
import { Person, Citizen, Needs } from './components';
import { TestSystem } from './systems/clusters/test_system';

/**
 * Реестр компонентов для запросов по именам
 */
const COMPONENT_REGISTRY: Record<
  string,
  Record<string, (number | string | EntityId | undefined)[]>
> = {
  Person,
  Citizen,
  Needs,
};

const systemRegistry: Record<string, System> = {
  Population: PopulationSystem,
  Needs: NeedsSystem,
  DailyRoutine: DailyRoutineSystem,
  Test: TestSystem,
} as const;

export type SystemName = keyof typeof systemRegistry;
export type systemsClusters = Record<string, SystemCluster>;

export class ECSManager {
  private world: World;
  private entityFactory: EntityFactory; // Фабрика сущностей для создания новых сущностей
  private systems: Record<string, System> = {}; // Все системы по именам
  private queries: Map<string, ReturnType<typeof query>> = new Map(); // Кэш query объектов
  private systemsClusters: systemsClusters = {
    population: {
      systemNames: [],
      enabled: true,
      interval: 60.0, // Каждую секунду
    },
    economy: {
      systemNames: [], // Можно добавить экономические системы
      enabled: true,
      interval: 120.0,
    },
    infrastructure: {
      systemNames: ['Test'], // Можно добавить инфраструктурные системы
      enabled: true,
      interval: 240.0,
    },
  };
  private clusterTimers: Map<string, number> = new Map(); // Отслеживание времени для интервалов кластеров
  private currentGameTimeOfDay: number = 0; // Текущее время дня в минутах

  constructor(private eventBus: EventBus) {
    console.log('🚀 ECSManager initialized');
    this.world = createWorld();
    this.entityFactory = new EntityFactory(this.world);

    // Инициализируем query объекты для часто используемых комбинаций компонентов
    this.initializeQueries();

    // Регистрируем базовые системы
    this.registerBaseSystems();

    // Инициализируем кластеры
    this.initializeClusters();

    // Подписываемся на LogicTick для обновления систем
    this.eventBus.on(Events.LogicTick, (payload) => {
      const tickData = payload as LogicTickData;
      this.updateSystems(tickData);
    });

    // Подписываемся на GameTimeUpdated для получения актуального времени
    this.eventBus.on(Events.GameTimeUpdated, (payload) => {
      if (!payload) return;
      const timeData = payload;
      this.currentGameTimeOfDay = timeData.minutesOfDay;
    });

    // Подписываемся на CallSystem для вызова систем по событиям
    this.eventBus.on(Events.CallSystem, (payload) => {
      const callData = payload as CallSystemPayload;
      this.handleCallSystem(callData);
    });
  }

  /**
   * Инициализирует query объекты для часто используемых комбинаций компонентов
   */
  private initializeQueries(): void {
    // В bitECS query принимает компоненты как отдельные аргументы
    // Но для динамических запросов мы будем создавать query на лету
    console.log(`📋 Query system initialized`);
  }

  /**
   * Регистрирует базовые системы
   */
  private registerBaseSystems(): void {
    for (const [systemName, system] of Object.entries(systemRegistry)) {
      this.registerSystem(systemName, system);
    }

    console.log(`📋 Registered ${Object.keys(this.systems).length} base systems`);
  }

  /**
   * Инициализирует кластеры
   */
  private initializeClusters(): void {
    for (const [clusterName, cluster] of Object.entries(this.systemsClusters)) {
      // Проверяем, что все системы кластера зарегистрированы
      for (const systemName of cluster.systemNames) {
        if (!this.systems[systemName]) {
          throw new Error(
            `System "${systemName}" not found in cluster "${clusterName}", systems: ${Object.keys(this.systems)}`,
          );
        }
      }

      // Инициализируем таймер для кластера
      this.clusterTimers.set(clusterName, 0);
      console.log(
        `📋 Initialized cluster "${clusterName}" with ${cluster.systemNames.length} systems ` +
          `(interval: ${cluster.interval ?? 'every tick'})`,
      );
    }
    console.log(`📋 Total clusters initialized: ${Object.keys(this.systemsClusters).length}`);
  }

  /**
   * Обрабатывает событие CallSystem
   */
  private handleCallSystem(callData: CallSystemPayload): void {
    try {
      if (callData.entityId !== undefined) {
        // Вызвать систему для конкретной сущности
        this.callSystemForEntity(callData.systemName, callData.entityId, callData.extraData);
      } else {
        // Вызвать систему для всех подходящих сущностей
        this.callSystem(callData.systemName, undefined, callData.extraData);
      }
    } catch (error) {
      console.error(`Error calling system "${callData.systemName}":`, error);
    }
  }

  /**
   * Регистрирует систему по имени
   */
  registerSystem(name: string, system: System): void {
    if (this.systems[name]) {
      console.warn(`System "${name}" is already registered, overwriting`);
    }

    this.validateSystem(system);
    this.systems[name] = system;
    console.log(`📋 Registered system: ${name}`);
  }

  /**
   * Вызывает систему по имени
   */
  callSystem(systemName: string, entities?: EntityId[], extraData?: unknown): void {
    const system = this.systems[systemName];
    if (!system) {
      throw new Error(`System "${systemName}" not found`);
    }

    const targetEntities = entities || this.queryEntities(system.components);
    system.update(this.world, targetEntities, 0, extraData);
  }

  /**
   * Вызывает систему по имени для конкретных сущностей
   */
  callSystemForEntities(systemName: string, entityIds: EntityId[], extraData?: unknown): void {
    this.callSystem(systemName, entityIds, extraData);
  }

  /**
   * Вызывает систему по имени для одной сущности
   */
  callSystemForEntity(systemName: string, entityId: EntityId, extraData?: unknown): void {
    this.callSystemForEntities(systemName, [entityId], extraData);
  }

  /**
   * Валидирует систему
   */
  private validateSystem(system: System): void {
    if (!system.name || typeof system.name !== 'string') {
      throw new Error('System must have a valid name');
    }

    if (!Array.isArray(system.components) || system.components.length === 0) {
      throw new Error(`System "${system.name}" must have at least one component`);
    }

    if (typeof system.update !== 'function') {
      throw new Error(`System "${system.name}" must have an update function`);
    }
  }

  /**
   * Обновляет все кластеры систем с учетом интервалов
   * Вызывается на каждый LogicTick
   */
  private updateSystems(tickData: LogicTickData): void {
    const deltaTime = tickData.delta;

    for (const [clusterName, cluster] of Object.entries(this.systemsClusters)) {
      if (!cluster.enabled) continue;

      // Обновляем таймер кластера
      const currentTimer = this.clusterTimers.get(clusterName) || 0;
      const newTimer = currentTimer + deltaTime;

      // Проверяем, нужно ли обновлять кластер
      const shouldUpdate = !cluster.interval || newTimer >= cluster.interval;

      if (shouldUpdate) {
        // Обновляем все системы в кластере
        for (const systemName of cluster.systemNames) {
          this.callSystem(systemName, undefined, this.currentGameTimeOfDay);
        }

        // Сбрасываем таймер
        this.clusterTimers.set(clusterName, 0);
      } else {
        // Накапливаем время
        this.clusterTimers.set(clusterName, newTimer);
      }
    }
  }

  /**
   * Запрашивает сущности по компонентам
   * Возвращает сущности, которые имеют все указанные компоненты
   */
  private queryEntities(componentNames: readonly string[]): EntityId[] {
    if (componentNames.length === 0) {
      return [];
    }

    // Получаем компонент-объекты по именам
    const components = componentNames
      .map((name) => {
        const component = COMPONENT_REGISTRY[name];
        if (!component) {
          console.warn(`Component "${name}" not found in registry`);
          return null;
        }
        return component;
      })
      .filter((comp) => comp !== null);

    if (components.length === 0) {
      return [];
    }

    // Используем bitECS 0.4.0 query API: query(world, [components])
    return Array.from(query(this.world, components));
  }

  /**
   * Получить фабрику сущностей
   */
  get entities(): EntityFactory {
    return this.entityFactory;
  }

  /**
   * Получить мир (использовать осторожно - предоставляет прямой доступ к Bitecs)
   */
  getWorld(): World {
    return this.world;
  }

  /**
   * Создать сущность
   */
  createEntity(): EntityId {
    return addEntity(this.world);
  }

  /**
   * Уничтожить сущность
   */
  destroyEntity(eid: EntityId): void {
    removeEntity(this.world, eid);
  }

  /**
   * Включить/отключить кластер
   */
  private setClusterEnabled(clusterName: string, enabled: boolean): void {
    const cluster = this.systemsClusters[clusterName];
    if (cluster) {
      cluster.enabled = enabled;
      console.log(`📋 Cluster "${clusterName}" ${enabled ? 'enabled' : 'disabled'}`);
    } else {
      console.warn(`⚠️ Cluster "${clusterName}" not found`);
    }
  }

  /**
   * Получить список всех зарегистрированных систем
   */
  getRegisteredSystems(): string[] {
    return Object.keys(this.systems);
  }

  /**
   * Проверить, зарегистрирована ли система
   */
  isSystemRegistered(systemName: string): boolean {
    return systemName in this.systems;
  }

  /**
   * Проверить, включен ли кластер
   */
  isClusterEnabled(clusterName: string): boolean {
    const cluster = this.systemsClusters[clusterName];
    return cluster ? cluster.enabled : false;
  }

  /**
   * Получить статистику симуляции
   */
  private getStats(): {
    totalSystemsCount: number;
    clustersCount: number;
    clusters: Record<
      string,
      {
        systemsCount: number;
        systems: string[];
        enabled: boolean;
        interval?: number;
      }
    >;
  } {
    const clusters: Record<
      string,
      {
        systemsCount: number;
        systems: string[];
        enabled: boolean;
        interval?: number;
      }
    > = {};

    for (const [clusterName, cluster] of Object.entries(this.systemsClusters)) {
      clusters[clusterName] = {
        systemsCount: cluster.systemNames.length,
        systems: cluster.systemNames,
        enabled: cluster.enabled,
        interval: cluster.interval,
      };
    }

    return {
      totalSystemsCount: Object.keys(this.systems).length,
      clustersCount: Object.keys(clusters).length,
      clusters,
    };
  }
}
