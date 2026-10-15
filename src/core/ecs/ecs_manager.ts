import { createWorld, deleteWorld, getAllEntities, query, World } from 'bitecs';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { TickManager } from '../tick/tick_manager';
import { Logger } from '../utils/logger';
import { ComponentRegistry } from './registry/component_registry';
import { SystemRegistry } from './registry/system_registry';
import { ClusterRegistry } from './registry/cluster_registry';
import { EntityFactoryRegistry } from './registry/entity_factory_registry';
import { ECSRegistries, getGlobalECSRegistries } from './registry/ecs_registries';
import { SystemFunction } from './core/smart_constructors';
import { CallSystemPayload } from '../event_bus/types';
import { ECSDebugStats } from '../modules/base_modules/debug_module/components/ecs_debug';

// Игровое время за один тик (независимо от скорости игры)
// 144000ms = игровой день (24ч) за 1 мин реального времени при 10 тиках/сек
export const GAME_TIME_PER_TICK = 144000; // ms

/** Функция отписки от события, возвращаемая EventBus.on */
type Unsubscribe = () => void;

export class ECSManager {
  private world: World;
  private scheduleManager: ScheduleManager;
  private eventSystemMap: Map<string, SystemFunction[]> = new Map();
  private logger: Logger;
  /** Отписки от всех событий, подписанных в setupEventSubscriptions/setupTickSubscription */
  private unsubscribers: Unsubscribe[] = [];
  private destroyed: boolean = false;

  constructor(
    private eventBus: EventBus,
    private tickManager: TickManager,
    private registries: ECSRegistries = getGlobalECSRegistries(),
  ) {
    this.logger = Logger.create('ECSManager');
    this.logger.info('ECSManager initialized');
    this.world = createWorld();
    this.scheduleManager = new ScheduleManager(
      this.world,
      this.eventBus,
      this.registries.systems,
      this.registries.clusters,
    );

    // Подписываемся на события для event-driven систем
    this.setupEventSubscriptions();

    // Подписываемся на LogicTick для обновления систем каждый тик
    this.setupTickSubscription();

    // Автоматическая регистрация компонентов, систем и кластеров
    this.initECSManager();
  }

  /**
   * Возвращает BitECS world
   */
  getWorld(): World {
    return this.world;
  }

  getRegistries(): ECSRegistries {
    return this.registries;
  }

  /**
   * Возвращает статистику ECS для дебаг панели
   */
  getStats(): ECSDebugStats {
    const componentRegistry = this.registries.components;
    const systemRegistry = this.registries.systems;
    const clusterRegistry = this.registries.clusters;

    // Преобразуем кластеры в формат для дебаг панели
    const clusters: Record<
      string,
      { systemsCount: number; systems: string[]; enabled: boolean; interval?: number }
    > = {};
    for (const [clusterName, cluster] of clusterRegistry.getAll()) {
      clusters[clusterName] = {
        systemsCount: cluster.systemNames.length,
        systems: cluster.systemNames,
        enabled: cluster.metadata.enabled,
        interval: cluster.metadata.interval,
      };
    }

    const { totalEntities, entityCounts } = this.collectEntityStats(componentRegistry);

    return {
      totalSystemsCount:
        this.scheduleManager.getSystems().length + this.scheduleManager.getIntervalSystems().length,
      clustersCount: clusterRegistry.size(),
      systems: Array.from(systemRegistry.getAll().keys()),
      totalEntities,
      entityCounts,
      clusters,
      intervalSystems: this.scheduleManager.getIntervalSystems().map((is) => is.name),
      eventSystems: Object.fromEntries(
        Array.from(this.eventSystemMap.entries()).map(([event, systems]) => [
          event,
          systems.map((sys) => sys.name || 'unnamed'),
        ]),
      ),
    };
  }

  /**
   * Считает реальное количество сущностей в мире и их распределение по компонентам.
   * Стоимость линейна по числу сущностей, поэтому вызывается только для дебага.
   */
  private collectEntityStats(componentRegistry: ComponentRegistry): {
    totalEntities: number;
    entityCounts: Record<string, number>;
  } {
    const entityCounts: Record<string, number> = {};

    const allEntities = getAllEntities(this.world);

    for (const [componentName, component] of componentRegistry.getAll()) {
      entityCounts[componentName] = query(this.world, [component]).length;
    }

    return { totalEntities: allEntities.length, entityCounts };
  }

  /**
   * Автоматическая регистрация компонентов из ComponentRegistry
   * Вызывается в initECSManager() для автоматической настройки
   */
  private autoRegisterComponents(): void {
    // Компоненты уже созданы через defineComponent() в createComponent() и лежат
    // в ComponentRegistry. Здесь только фиксируем их количество в BitECS-мире.
    this.logger.debug(`Registered ${this.registries.components.size()} components`);
  }

  /**
   * Автоматическая регистрация систем из SystemRegistry
   * Вызывается в initECSManager() для автоматической настройки
   */
  private autoRegisterSystems(): void {
    const registry = this.registries.systems;

    // Раскладываем системы по способу выполнения: event-driven, интервальные
    // и per-tick. Per-tick системы кластеров выполняются через updateClusters(),
    // поэтому в ScheduleManager попадают только системы без кластера — иначе они
    // выполнялись бы дважды за тик.
    for (const [name, registeredSystem] of registry.getAll()) {
      const { system, metadata } = registeredSystem;

      if (metadata.enabled === false) {
        this.logger.debug(`Skipped disabled system: ${name}`);
        continue;
      }

      const eventTriggers = metadata.eventTriggers ?? [];
      if (eventTriggers.length > 0) {
        for (const eventName of eventTriggers) {
          this.registerEventSystem(eventName, system);
        }
        this.logger.debug(
          `Registered event-driven system: ${name} (events: ${eventTriggers.join(', ')})`,
        );
        continue;
      }

      if (metadata.interval !== undefined && metadata.interval > 0) {
        this.scheduleManager.registerIntervalSystem(name, system, metadata.interval);
        this.logger.debug(
          `Registered interval system: ${name} (${metadata.interval}ms, cluster: ${metadata.cluster ?? 'none'})`,
        );
        continue;
      }

      if (metadata.cluster) {
        // Выполняется через свой кластер в updateClusters()
        this.logger.debug(`Registered clustered system: ${name} (cluster: ${metadata.cluster})`);
        continue;
      }

      this.scheduleManager.registerSystem(name, system);
      this.logger.debug(`Registered per-tick system: ${name}`);
    }

    this.logger.info(
      `Auto-registered ${registry.size()} systems ` +
        `(${this.scheduleManager.getSystems().length} per-tick, ` +
        `${this.scheduleManager.getIntervalSystems().length} interval)`,
    );
  }

  /**
   * Автоматическая регистрация кластеров из ClusterRegistry
   * Вызывается в initECSManager() для автоматической настройки
   */
  private autoRegisterClusters(): void {
    const clusterRegistry = this.registries.clusters;
    const systemRegistry = this.registries.systems;

    // Автоматически создать кластеры на основе метаданных систем
    clusterRegistry.autoCreateFromSystemMetadata(systemRegistry.getAll());

    this.logger.debug(`Registered ${clusterRegistry.size()} clusters`);
  }

  /**
   * Настройка подписок на события для event-driven систем
   */
  private setupEventSubscriptions(): void {
    // Подписываемся на Events.CallSystem для ручного вызова систем
    this.unsubscribers.push(
      this.eventBus.on(Events.CallSystem, (payload) => {
        if (payload && 'systemName' in payload) {
          this.handleCallSystem(payload);
        }
      }),
    );

    this.logger.debug('Event subscriptions setup for event-driven systems');
  }

  /**
   * Настройка подписки на LogicTick для автоматического обновления систем
   */
  private setupTickSubscription(): void {
    // Подписываемся на LogicTick события от TickManager
    this.unsubscribers.push(
      this.eventBus.on(Events.LogicTick, (data) => {
        if (data && 'delta' in data) {
          // Обновляем системы каждый игровой тик
          this.scheduleManager.update(data.delta);
        }
      }),
    );

    this.logger.debug('Tick subscription setup for automatic system updates');
  }

  /**
   * Инициализация ECS менеджера с автоматической регистрацией
   * Вызывается в конструкторе для полной настройки
   */
  private initECSManager(): void {
    this.logger.info('Initializing ECS Manager with auto-registration...');

    // Автоматическая регистрация всех компонентов из реестра
    this.autoRegisterComponents();

    // Автоматическая регистрация всех систем из реестра
    this.autoRegisterSystems();

    // Автоматическая регистрация кластеров
    this.autoRegisterClusters();

    this.logger.info('ECS Manager initialization completed');
  }

  /**
   * Обработчик для вызова системы по имени (Events.CallSystem)
   */
  private handleCallSystem(payload: CallSystemPayload): void {
    const systemName = payload?.systemName;
    if (!systemName) return;

    // Находим систему в реестре и выполняем её
    const registry = this.registries.systems;
    const registeredSystem = registry.get(systemName);

    if (registeredSystem) {
      try {
        // delta = 0: ручной вызов вне тика, длительность шага неизвестна.
        // payload пробрасывается, чтобы система видела entityId/extraData.
        registeredSystem.system(this.world, 0, payload);
        this.logger.debug(`Executed system "${systemName}" via CallSystem event`);
      } catch (error) {
        this.logger.error(`Error executing system "${systemName}":`, error as Error);
      }
    } else {
      this.logger.warn(`System "${systemName}" not found for CallSystem event`);
    }
  }

  /**
   * Обработчик для event-driven систем
   * Выполняет все системы, подписанные на данное событие
   */
  private handleEventSystem(eventName: string, payload?: unknown): void {
    const systems = this.eventSystemMap.get(eventName);
    if (!systems || systems.length === 0) {
      return; // Нет систем, подписанных на это событие
    }

    for (const system of systems) {
      try {
        // delta = 0: событие вне тика. payload пробрасывается в систему.
        system(this.world, 0, payload);
      } catch (error) {
        this.logger.error(`Error in event-driven system for "${eventName}":`, error as Error);
      }
    }
  }

  /**
   * Регистрация системы для event-driven выполнения
   */
  registerEventSystem(eventName: string, system: SystemFunction): void {
    if (!this.eventSystemMap.has(eventName)) {
      this.eventSystemMap.set(eventName, []);
      // Подписываемся на событие только при первой регистрации
      this.unsubscribers.push(
        this.eventBus.on(eventName, (payload) => {
          this.handleEventSystem(eventName, payload);
        }),
      );
    }
    this.eventSystemMap.get(eventName)!.push(system);
    this.logger.debug(`Registered event-driven system for event "${eventName}"`);
  }

  /**
   * Очистка ресурсов: отписка от всех событий, сброс планировщика и освобождение мира
   */
  public destroy(): void {
    if (this.destroyed) return;

    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }
    this.unsubscribers = [];

    this.scheduleManager.destroy();
    this.eventSystemMap.clear();

    // Чистим только инжектированный контейнер: для глобального поведения
    // идентично очистке синглтонов, для изолированного — не трогает чужой контент.
    deleteWorld(this.world);
    this.registries.systems.clear();
    this.registries.clusters.clear();
    this.registries.components.clear();
    this.registries.entityFactories.clear();

    this.destroyed = true;
    this.logger.info('ECSManager destroyed and resources cleaned up');
  }

  /**
   * Метод для тестирования event-driven систем
   * Отправляет тестовые события для проверки работы систем
   */
  testEventSystems(): void {
    this.logger.info('Testing event-driven systems...');

    // Отправляем тестовые события
    // Test events (using emitLegacy for backward compatibility with test events)
    setTimeout(() => this.eventBus.emitLegacy('test:event', { testData: 'from test' }), 1000);
    setTimeout(() => this.eventBus.emitLegacy('custom:action', { action: 'test_action' }), 2000);
    setTimeout(() => this.eventBus.emitLegacy('nonexistent:event', {}), 3000); // Это событие не должно вызвать системы

    this.logger.info(
      'Test events scheduled (1s: test:event, 2s: custom:action, 3s: nonexistent:event)',
    );
  }

  /**
   * Метод для тестирования фабрик сущностей
   * Создает тестовые сущности через зарегистрированные фабрики
   */
  testEntityFactories(): void {
    const registry = this.registries.entityFactories;

    this.logger.info('Testing entity factories...');

    // Создаем mock world для тестирования фабрик
    const mockWorld = {} as World;

    // Тестируем все зарегистрированные фабрики
    for (const [name, factory] of registry.getAll()) {
      try {
        const entityId = factory.factory(mockWorld);
        this.logger.info(`Created entity via factory "${name}": entityId = ${entityId}`);
      } catch (error) {
        this.logger.error(`Error creating entity via factory "${name}":`, error as Error);
      }
    }

    this.logger.info(`Tested ${registry.size()} entity factories`);
  }

  /**
   * Метод для тестирования ScheduleManager
   * Запускает тестовый цикл обновления систем
   */
  testScheduleManager(duration = 5000, deltaTime = 100): void {
    this.logger.info(
      `Starting ScheduleManager test for ${duration}ms with deltaTime=${deltaTime}ms...`,
    );

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += deltaTime;
      this.scheduleManager.update(deltaTime);

      if (elapsed >= duration) {
        clearInterval(interval);
        this.logger.info('ScheduleManager test completed');
      }
    }, deltaTime);
  }
}

// ✅ Расширенный ScheduleManager для Phase 2 с поддержкой интервалов

interface IntervalSystem {
  system: SystemFunction;
  name: string;
  interval: number;
  lastExecuted: number;
}

interface PerTickSystem {
  system: SystemFunction;
  name: string;
}

export class ScheduleManager {
  private systems: PerTickSystem[] = [];
  private intervalSystems: IntervalSystem[] = [];
  private clusterTimers: Map<string, number> = new Map();
  private gameTime: number = 0; // Накопленное игровое время для кластеров
  private logger: Logger = Logger.create('ScheduleManager');

  constructor(
    private world: World,
    private eventBus: EventBus,
    private systemRegistry: SystemRegistry,
    private clusterRegistry: ClusterRegistry,
  ) {}

  /**
   * Регистрация per-tick системы (без кластера и без интервала).
   * Выполняется каждый тик в update().
   */
  registerSystem(name: string, system: SystemFunction): void {
    this.systems.push({ name, system });
  }

  /**
   * Регистрация системы с интервалом выполнения
   */
  registerIntervalSystem(name: string, system: SystemFunction, interval: number): void {
    this.intervalSystems.push({
      system,
      name,
      interval,
      lastExecuted: this.gameTime, // Начать с текущего игрового времени
    });
  }

  /**
   * Инициализация таймера для кластера
   */
  initClusterTimer(clusterName: string): void {
    this.clusterTimers.set(clusterName, 0);
  }

  /**
   * Выполнение набора систем кластера с учётом интервала кластера
   */
  private runClusterSystems(
    clusterName: string,
    systems: PerTickSystem[],
    deltaTime: number,
    interval?: number,
  ): void {
    if (interval === undefined) {
      for (const { system } of systems) {
        this.runSystem(clusterName, system, deltaTime);
      }
      return;
    }

    const currentTimer = this.clusterTimers.get(clusterName) || 0;
    const newTimer = currentTimer + deltaTime;

    if (newTimer >= interval) {
      for (const { system } of systems) {
        this.runSystem(clusterName, system, deltaTime);
      }
      this.clusterTimers.set(clusterName, 0); // Сброс таймера
    } else {
      this.clusterTimers.set(clusterName, newTimer);
    }
  }

  /**
   * Безопасный вызов системы: ошибка одной системы не должна ронять тик
   */
  private runSystem(context: string, system: SystemFunction, deltaTime: number): void {
    try {
      system(this.world, deltaTime);
    } catch (error) {
      this.logger.error(`Error in system of ${context}:`, error as Error);
    }
  }

  /**
   * Обновление кластеров систем
   */
  private updateClusters(deltaTime: number, gameTime: number): void {
    // Получить все кластеры
    for (const [clusterName, cluster] of this.clusterRegistry.getAll()) {
      if (!cluster.metadata.enabled) {
        continue; // Пропустить отключенные кластеры
      }

      const systems: PerTickSystem[] = [];

      for (const systemName of cluster.systemNames) {
        const registeredSystem = this.systemRegistry.get(systemName);
        if (!registeredSystem) {
          this.logger.warn(`System "${systemName}" not found for cluster "${clusterName}"`);
          continue;
        }

        const { system, metadata } = registeredSystem;

        // Проверить, включена ли система
        if (metadata.enabled === false) {
          continue; // Пропустить отключенную систему
        }

        // Интервальные системы внутри кластера: выполняются здесь же, чтобы не
        // обрабатываться ещё и в updateIntervalSystems()
        if (metadata.interval !== undefined && metadata.interval > 0) {
          const intervalSystem = this.intervalSystems.find((is) => is.name === systemName);
          if (!intervalSystem) continue;
          if (gameTime - intervalSystem.lastExecuted < intervalSystem.interval) continue;

          try {
            system(this.world, deltaTime);
            intervalSystem.lastExecuted = gameTime;
          } catch (error) {
            this.logger.error(
              `Error in interval system "${systemName}" of cluster "${clusterName}":`,
              error as Error,
            );
          }
          continue;
        }

        systems.push({ name: systemName, system });
      }

      this.runClusterSystems(
        clusterName,
        systems,
        deltaTime,
        cluster.metadata.interval === undefined ? undefined : cluster.metadata.interval,
      );
    }
  }

  /**
   * Выполнение интервальных систем, не входящих в кластеры
   */
  private updateIntervalSystems(gameTime: number, deltaTime: number): void {
    for (const intervalSystem of this.intervalSystems) {
      // Проверить, включена ли система
      const registeredSystem = this.systemRegistry.get(intervalSystem.name);
      if (registeredSystem && registeredSystem.metadata.enabled === false) {
        continue; // Пропустить отключенную систему
      }

      if (this.isEventDriven(intervalSystem.name)) {
        continue; // Event-driven система не выполняется по расписанию
      }

      if (this.isSystemInCluster(intervalSystem.name)) {
        continue; // Кластерные интервальные системы выполняются в updateClusters()
      }

      if (gameTime - intervalSystem.lastExecuted >= intervalSystem.interval) {
        try {
          intervalSystem.system(this.world, deltaTime);
          intervalSystem.lastExecuted = gameTime;
        } catch (error) {
          this.logger.error(`Error in interval system ${intervalSystem.name}:`, error as Error);
        }
      }
    }
  }

  /** Есть ли у системы event-триггеры (она не должна выполняться по расписанию) */
  private isEventDriven(systemName: string): boolean {
    const registeredSystem = this.systemRegistry.get(systemName);
    return (registeredSystem?.metadata.eventTriggers?.length ?? 0) > 0;
  }

  private isSystemInCluster(systemName: string): boolean {
    for (const cluster of this.clusterRegistry.getAll().values()) {
      if (cluster.systemNames.includes(systemName)) return true;
    }
    return false;
  }

  /**
   * Основной цикл тика: per-tick системы, кластеры, интервальные системы
   */
  update(deltaTime: number): void {
    // Обновить игровое время (фиксированная величина за тик, независимо от скорости)
    this.gameTime += GAME_TIME_PER_TICK;
    const gameTime = this.gameTime;

    // 1. Per-tick системы без кластера
    for (const { name, system } of this.systems) {
      const registeredSystem = this.systemRegistry.get(name);
      if (registeredSystem && registeredSystem.metadata.enabled === false) {
        continue;
      }
      if (registeredSystem && (registeredSystem.metadata.eventTriggers?.length ?? 0) > 0) {
        continue; // Event-driven система не выполняется по расписанию
      }
      this.runSystem(`per-tick system "${name}"`, system, deltaTime);
    }

    // 2. Кластеры систем
    this.updateClusters(deltaTime, gameTime);

    // 3. Интервальные системы без кластера
    this.updateIntervalSystems(gameTime, deltaTime);
  }

  /**
   * Сброс состояния планировщика
   */
  destroy(): void {
    this.systems = [];
    this.intervalSystems = [];
    this.clusterTimers.clear();
    this.gameTime = 0;
    this.logger.debug('ScheduleManager destroyed');
  }

  getSystems(): readonly PerTickSystem[] {
    return this.systems;
  }

  getIntervalSystems(): readonly IntervalSystem[] {
    return this.intervalSystems;
  }
}
