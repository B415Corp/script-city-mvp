import { createWorld, addEntity, removeEntity, World, EntityId, query } from 'bitecs';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { EventPayload } from '../event_bus/types';

import { EntityFactory } from './entities';
import { PopulationSystem, NeedsSystem, DailyRoutineSystem } from './systems/clusters';
import { System, EventDrivenSystem, SystemCluster } from './systems/types';
import { LogicTickData } from '../tick/types';
import { Person, Citizen, Needs } from './components';

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

const systemRegistry = {
  Population: PopulationSystem,
  Needs: NeedsSystem,
  DailyRoutine: DailyRoutineSystem,
} as const;

export type SystemName = keyof typeof systemRegistry;
export type systemsClusters = Record<string, SystemCluster>;

export class ECSManager {
  private world: World;
  private entityFactory: EntityFactory; // Фабрика сущностей для создания новых сущностей
  private systems: Record<string, System> = {}; // Все системы по именам
  private systemsClusters: systemsClusters = {
    population: {
      systemNames: ['Population', 'Needs', 'DailyRoutine'],
      enabled: true,
      interval: 1.0, // Каждую секунду
    },
    economy: {
      systemNames: [], // Можно добавить экономические системы
      enabled: true,
      interval: 5.0, // Каждые 5 секунд
    },
    infrastructure: {
      systemNames: [], // Можно добавить инфраструктурные системы
      enabled: true,
      interval: 10.0, // Каждые 10 секунд
    },
  };
  private clusterTimers: Map<string, number> = new Map(); // Отслеживание времени для интервалов кластеров
  private eventHandlers: Map<Events, Set<string>> = new Map(); // Событие -> имена систем

  constructor(private eventBus: EventBus) {
    console.log('🚀 ECSManager initialized');
    this.world = createWorld();
    this.entityFactory = new EntityFactory(this.world);

    // Регистрируем базовые системы
    this.registerBaseSystems();

    // Инициализируем кластеры
    this.initializeClusters();

    // Подписываемся на LogicTick для обновления систем
    this.eventBus.on(Events.LogicTick, (payload) => {
      const tickData = payload as LogicTickData;
      this.updateSystems(tickData);
    });

    // Настраиваем единый event handler
    this.setupEventHandler();
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
          throw new Error(`System "${systemName}" not found in cluster "${clusterName}"`);
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
   * Регистрирует event-driven систему
   */
  registerEventDrivenSystem(name: string, system: EventDrivenSystem): void {
    this.validateEventDrivenSystem(system);

    // Регистрируем систему в общей коллекции
    this.systems[name] = system as System;

    // Добавляем в event handlers
    if (!this.eventHandlers.has(system.eventName)) {
      this.eventHandlers.set(system.eventName, new Set());
    }
    this.eventHandlers.get(system.eventName)!.add(name);

    console.log(`📋 Registered event-driven system: ${name} (event: ${system.eventName})`);
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
   * Валидирует event-driven систему
   */
  private validateEventDrivenSystem(system: EventDrivenSystem): void {
    this.validateSystem(system as System);

    if (!system.eventName) {
      throw new Error(`EventDrivenSystem "${system.name}" must have a valid eventName`);
    }
  }

  /**
   * Настраивает единый event handler для всех event-driven систем
   */
  private setupEventHandler(): void {
    // Создаем единый обработчик для всех событий
    const eventHandler = (eventData: EventPayload<Events>, eventName: Events): void => {
      const systemNames = this.eventHandlers.get(eventName);
      if (!systemNames) return;

      for (const systemName of systemNames) {
        try {
          this.callSystem(systemName, undefined, eventData);
        } catch (error) {
          console.error(`Error calling system "${systemName}" for event ${eventName}:`, error);
        }
      }
    };

    // Подписываемся на все используемые события
    for (const eventName of this.eventHandlers.keys()) {
      this.eventBus.on(eventName, (eventData) => eventHandler(eventData, eventName));
      const systemCount = this.eventHandlers.get(eventName)?.size || 0;
      console.log(`📋 Subscribed ${systemCount} systems to event: ${eventName}`);
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
          this.callSystem(systemName, undefined, tickData.gameTimeOfDay);
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

    // Простая реализация: проверяем все сущности
    // В будущем можно оптимизировать с помощью bitecs query
    const result: EntityId[] = [];

    // Перебираем разумное количество сущностей (можно оптимизировать)
    for (let eid = 0; eid < 10000; eid++) {
      let hasAllComponents = true;

      for (const component of components) {
        // Проверяем наличие компонента (упрощенная проверка)
        // Для каждого компонента проверяем, есть ли хотя бы одно поле
        const componentFields = Object.keys(component);
        if (componentFields.length === 0) continue;

        const firstField = componentFields[0];
        const fieldArray = component[firstField];
        if (!fieldArray || eid >= fieldArray.length || fieldArray[eid] === undefined) {
          hasAllComponents = false;
          break;
        }
      }

      if (hasAllComponents) {
        result.push(eid);
      }
    }

    return result;
  }

  /**
   * Получить фабрику сущностей
   */
  get entities(): EntityFactory {
    return this.entityFactory;
  }

  /**
   * Получить мир
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
  setClusterEnabled(clusterName: string, enabled: boolean): void {
    const cluster = this.systemsClusters[clusterName];
    if (cluster) {
      cluster.enabled = enabled;
      console.log(`📋 Cluster "${clusterName}" ${enabled ? 'enabled' : 'disabled'}`);
    } else {
      console.warn(`⚠️ Cluster "${clusterName}" not found`);
    }
  }

  /**
   * Установить интервал для кластера
   */
  setClusterInterval(clusterName: string, interval: number | undefined): void {
    const cluster = this.systemsClusters[clusterName];
    if (cluster) {
      cluster.interval = interval;
      console.log(`📋 Cluster "${clusterName}" interval set to ${interval ?? 'every tick'}`);
    } else {
      console.warn(`⚠️ Cluster "${clusterName}" not found`);
    }
  }

  /**
   * Добавить кластер систем
   */
  addCluster(clusterName: string, cluster: SystemCluster): void {
    if (this.systemsClusters[clusterName]) {
      throw new Error(`Cluster "${clusterName}" already exists`);
    }

    // Проверяем, что все системы кластера зарегистрированы
    for (const systemName of cluster.systemNames) {
      if (!this.systems[systemName]) {
        throw new Error(`System "${systemName}" not found for cluster "${clusterName}"`);
      }
    }

    this.systemsClusters[clusterName] = cluster;
    this.clusterTimers.set(clusterName, 0);
    console.log(`📋 Added cluster "${clusterName}" with ${cluster.systemNames.length} systems`);
  }

  /**
   * Получить статистику симуляции
   */
  getStats(): {
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
    eventDrivenSystemsCount: number;
    eventDrivenSystems: string[];
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

    // Подсчитываем event-driven системы
    let eventDrivenCount = 0;
    const eventDrivenNames: string[] = [];

    for (const systemName of Object.keys(this.systems)) {
      const system = this.systems[systemName];
      if ('eventName' in system) {
        eventDrivenCount++;
        eventDrivenNames.push(systemName);
      }
    }

    return {
      totalSystemsCount: Object.keys(this.systems).length,
      clustersCount: Object.keys(clusters).length,
      clusters,
      eventDrivenSystemsCount: eventDrivenCount,
      eventDrivenSystems: eventDrivenNames,
    };
  }
}
