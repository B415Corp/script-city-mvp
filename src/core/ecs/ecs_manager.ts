import { createWorld, addEntity, removeEntity, World, EntityId, query } from 'bitecs';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { CallSystemPayload } from '../event_bus/types';
import { TimeService } from '../tick/time_service';
import { TickManager } from '../tick/tick_manager';
import { Logger } from '../utils/logger';

import { EntityFactory } from './entities';
import { createDayNightCycleSystem } from './systems/clusters/day_night_cycle_system';
import {
  createWorkSystem,
  createMovementSystem,
  createHappinessSystem,
} from './systems/clusters/schedule_activity_systems';
import { SystemCluster } from './systems/types';
import { LogicTickData } from '../tick/types';
import { Person } from './components/population';
import { Residential, Workplace } from './components/buildings';

// Временно отключен COMPONENT_REGISTRY - новые компоненты имеют другой формат
// TODO: Адаптировать для новых компонентов с TypedArrays
/*
const COMPONENT_REGISTRY: Record<
  string,
  Record<string, unknown[]> | Record<string, Record<string, unknown>[]> // Компоненты bitECS
> = {
  Person,
  Citizen,
  Needs,
  Schedule,
  Shop,
  Factory,
  Position,
  Residential,
  Workplace,
};
*/

// ✅ Регистр кластеров для нового ScheduleManager
const clustersRegistry: Record<string, SystemCluster> = {
  population: {
    systemNames: ['Work', 'Movement', 'Happiness'],
    enabled: true,
    interval: undefined, // Каждый тик
  },
  economy: {
    systemNames: [], // Экономические системы отключены в упрощенной симуляции
    enabled: false,
    interval: undefined,
  },
  infrastructure: {
    systemNames: ['DayNightCycle'], // Только цикл дня и ночи
    enabled: true,
    interval: 240.0,
  },
};

export type systemsClusters = Record<string, SystemCluster>;

// ✅ Новый ScheduleManager согласно плану рефакторинга BitECS 0.4.0
export type SystemFunction = (world: World, delta?: number) => void;

export class ScheduleManager {
  private systems: SystemFunction[] = [];

  constructor(
    private world: World,
    private eventBus: EventBus,
  ) {}

  registerSystem(system: SystemFunction): void {
    this.systems.push(system);

    if (import.meta.env.DEV) {
      console.log('[ScheduleManager] Registered system');
    }
  }

  update(delta: number): void {
    for (const system of this.systems) {
      try {
        system(this.world, delta);
      } catch (error) {
        console.error('[ScheduleManager] Error in system:', error);

        this.eventBus.emit(Events.SystemError, {
          systemName: system.name || 'unknown',
          error: error as Error,
        });
      }
    }
  }

  getSystems(): readonly SystemFunction[] {
    return this.systems;
  }
}

export class ECSManager {
  private world: World;
  private entityFactory: EntityFactory;
  private scheduleManager: ScheduleManager;
  private systemsClusters: systemsClusters = clustersRegistry;
  private clusterTimers: Map<string, number> = new Map();
  private timeService: TimeService;
  private logger: Logger;

  constructor(
    private eventBus: EventBus,
    private tickManager: TickManager,
  ) {
    this.logger = Logger.create('ECSManager');
    this.logger.info('ECSManager initialized');
    this.world = createWorld();
    this.entityFactory = new EntityFactory(this.world);
    this.scheduleManager = new ScheduleManager(this.world, this.eventBus);

    // Инициализируем TimeService
    this.timeService = tickManager.getTimeService();

    // Регистрируем базовые системы
    this.registerBaseSystems();

    // Инициализируем кластеры
    this.initializeClusters();

    // Подписываемся на LogicTick для обновления систем
    this.eventBus.on(Events.LogicTick, (payload) => {
      const tickData = payload as LogicTickData;
      this.updateSystems(tickData);
    });
  }

  /**
   * Регистрирует базовые системы
   */
  private registerBaseSystems(): void {
    // ✅ Создаем системы согласно плану рефакторинга BitECS 0.4.0
    const workSystem = createWorkSystem(this.timeService);
    const movementSystem = createMovementSystem();
    const happinessSystem = createHappinessSystem(this.timeService);

    // Регистрируем системы в ScheduleManager
    this.scheduleManager.registerSystem(workSystem);
    this.scheduleManager.registerSystem(movementSystem);
    this.scheduleManager.registerSystem(happinessSystem);

    this.logger.info('Registered base systems in ScheduleManager');
  }

  /**
   * Инициализирует кластеры
   */
  private initializeClusters(): void {
    for (const [clusterName, cluster] of Object.entries(this.systemsClusters)) {
      // Инициализируем таймер для кластера
      this.clusterTimers.set(clusterName, 0);
      this.logger.info(
        `Initialized cluster "${clusterName}" with ${cluster.systemNames.length} systems ` +
          `(interval: ${cluster.interval ?? 'every tick'})`,
      );
    }
    this.logger.info(`Total clusters initialized: ${Object.keys(this.systemsClusters).length}`);
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
        // ✅ Используем ScheduleManager для обновления всех систем кластера
        this.scheduleManager.update(deltaTime);

        // Сбрасываем таймер
        this.clusterTimers.set(clusterName, 0);
      } else {
        // Накапливаем время
        this.clusterTimers.set(clusterName, newTimer);
      }
    }
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
      this.logger.info(`Cluster "${clusterName}" ${enabled ? 'enabled' : 'disabled'}`);
    } else {
      console.warn(`⚠️ Cluster "${clusterName}" not found`);
    }
  }

  /**
   * Проверить, включен ли кластер
   */
  isClusterEnabled(clusterName: string): boolean {
    const cluster = this.systemsClusters[clusterName];
    return cluster ? cluster.enabled : false;
  }

  /**
   * Получить количество сущностей
   */
  getEntityCount(): number {
    // В BiteCS нет прямого способа получить общее количество сущностей
    // Используем query с компонентом Person для подсчета (Person есть у всех жителей)
    try {
      const entities = query(this.world, [Person]);
      return entities.length;
    } catch {
      return 0;
    }
  }

  /**
   * Получить количество сущностей по типам компонентов
   */
  getEntityCountsByType(): Record<string, number> {
    const counts: Record<string, number> = {};

    // ✅ Используем query для подсчета сущностей
    try {
      const personEntities = query(this.world, [Person]);
      counts['Person'] = personEntities.length;
    } catch {
      counts['Person'] = 0;
    }

    try {
      const residentialEntities = query(this.world, [Residential]);
      counts['Residential'] = residentialEntities.length;
    } catch {
      counts['Residential'] = 0;
    }

    try {
      const workplaceEntities = query(this.world, [Workplace]);
      counts['Workplace'] = workplaceEntities.length;
    } catch {
      counts['Workplace'] = 0;
    }

    return counts;
  }

  /**
   * Получить текущее игровое время в минутах
   */
  getGameTime(): number {
    return this.timeService.getTimeData().totalMinutes;
  }

  getTimeService(): TimeService {
    return this.timeService;
  }

  /**
   * Получить статистику симуляции
   */
  getStats(): {
    totalSystemsCount: number;
    clustersCount: number;
    systems: string[]; // Список всех зарегистрированных систем
    totalEntities: number; // Общее количество сущностей
    entityCounts: Record<string, number>; // Количество сущностей по типам
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
      totalSystemsCount: this.scheduleManager.getSystems().length,
      clustersCount: Object.keys(clusters).length,
      systems: this.scheduleManager.getSystems().map((s) => s.name || 'unknown'), // Список всех зарегистрированных систем
      totalEntities: this.getEntityCount(), // Общее количество сущностей
      entityCounts: this.getEntityCountsByType(), // Количество сущностей по типам
      clusters,
    };
  }
}
