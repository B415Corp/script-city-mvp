import { createWorld, World } from 'bitecs';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { TickManager } from '../tick/tick_manager';
import { Logger } from '../utils/logger';
import { ComponentRegistry } from './registry/component_registry';
import { SystemRegistry } from './registry/system_registry';
import { ClusterRegistry } from './registry/cluster_registry';
import { EntityFactoryRegistry } from './registry/entity_factory_registry';
import { SystemFunction } from './core/smart_constructors';
import { CallSystemPayload } from '../event_bus/types';
import { LogicTickData } from '../tick/types';
import { ECSDebugStats } from '../modules/base_modules/debug_module/components/ecs_debug';

// Игровое время за один тик (независимо от скорости игры)
const GAME_TIME_PER_TICK = 100; // ms

interface ECSStats {
  totalSystemsCount: number;
  clustersCount: number;
  systems: string[];
  clusters: Record<string, unknown>;
  entityCount: number;
  entityCounts: Record<string, number>;
  gameTime: number;
  timeData: unknown;
  totalEntities: number;
  components: string[];
  intervalSystems: string[];
  eventSystems: Record<string, string[]>;
}

// Временно закомментированы импорты удаленных модулей для Phase 0
// import { EntityFactory } from './entities';
// import { createDayNightCycleSystem } from './systems/clusters/day_night_cycle_system';
// import {
//   createWorkSystem,
//   createMovementSystem,
//   createHappinessSystem,
// } from './systems/clusters/schedule_activity_systems';
// import { SystemCluster } from './systems/types';
// import { LogicTickData } from '../tick/types';
// import { Person, Citizen, Needs } from './components/population';
// import { Residential, Workplace, Commercial } from './components/buildings';
// import { Position } from './components/shared/position_component';
// import { ID } from './components/shared/id_component';
// import { Render } from './components/shared/render_component';
// import { Schedule } from './components/shared/schedule_component';

export class ECSManager {
  private world: World;
  private scheduleManager: ScheduleManager;
  private eventSystemMap: Map<string, SystemFunction[]> = new Map();
  private logger: Logger;

  constructor(
    private eventBus: EventBus,
    private tickManager: TickManager,
  ) {
    this.logger = Logger.create('ECSManager');
    this.logger.info('ECSManager initialized (Phase 3 - with Event system)');
    this.world = createWorld();
    this.scheduleManager = new ScheduleManager(
      this.world,
      this.eventBus,
      SystemRegistry.getInstance(),
      ClusterRegistry.getInstance(),
    );

    // Подписываемся на события для event-driven систем
    this.setupEventSubscriptions();

    // Подписываемся на LogicTick для обновления систем каждый тик
    this.setupTickSubscription();

    // Автоматическая регистрация компонентов, систем и кластеров
    this.initECSManager();
  }

  /**
   * Возвращает BitECS world (для Phase 0 - пустой)
   */
  getWorld(): World {
    return this.world;
  }

  /**
   * Возвращает статистику ECS для дебаг панели
   */
  getStats(): ECSDebugStats {
    const componentRegistry = ComponentRegistry.getInstance();
    const systemRegistry = SystemRegistry.getInstance();
    const clusterRegistry = ClusterRegistry.getInstance();

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

    return {
      totalSystemsCount:
        this.scheduleManager.getSystems().length + this.scheduleManager.getIntervalSystems().length,
      clustersCount: clusterRegistry.size(),
      systems: Array.from(systemRegistry.getAll().keys()),
      totalEntities: 0, // Пока нет сущностей
      entityCounts: {}, // Пока нет сущностей по типам
      clusters,
    };
  }

  // В Phase 0 остальные методы не нужны - ECS отключен

  /**
   * Автоматическая регистрация компонентов из ComponentRegistry
   * Вызывается в initECSManager() для автоматической настройки
   */
  private autoRegisterComponents(): void {
    const registry = ComponentRegistry.getInstance();

    // Регистрируем все компоненты в BitECS мире
    for (const [name, component] of registry.getAll()) {
      // Компоненты уже созданы через defineComponent() в createComponent()
      // Здесь можно добавить дополнительную логику регистрации если нужно
      this.logger.info(`Auto-registered component: ${name}`);
    }

    this.logger.info(`Auto-registered ${registry.size()} components`);
  }

  /**
   * Автоматическая регистрация систем из SystemRegistry
   * Вызывается в initECSManager() для автоматической настройки
   */
  private autoRegisterSystems(): void {
    const registry = SystemRegistry.getInstance();

    // Регистрируем все системы в ScheduleManager или как event-driven
    for (const [name, registeredSystem] of registry.getAll()) {
      const { system, metadata } = registeredSystem;

      // Проверяем eventTriggers для event-driven систем
      if (metadata.eventTriggers && metadata.eventTriggers.length > 0) {
        // Event-driven система - регистрируем для каждого события
        for (const eventName of metadata.eventTriggers) {
          this.registerEventSystem(eventName, system);
        }
        this.logger.info(
          `Auto-registered event-driven system: ${name} (events: ${metadata.eventTriggers.join(', ')})`,
        );
      }
      // Проверяем интервал для интервальных систем
      else if (metadata.interval && metadata.interval > 0) {
        // Система с интервалом
        this.scheduleManager.registerIntervalSystem(name, system, metadata.interval);
        this.logger.info(
          `Auto-registered interval system: ${name} (${metadata.interval}ms, cluster: ${metadata.cluster || 'none'})`,
        );
      } else {
        // Обычная система (каждый тик)
        this.scheduleManager.registerSystem(system);
        this.logger.info(
          `Auto-registered system: ${name} (every tick, cluster: ${metadata.cluster || 'none'})`,
        );
      }
    }

    this.logger.info(`Auto-registered ${registry.size()} systems`);
  }

  /**
   * Автоматическая регистрация кластеров из ClusterRegistry
   * Вызывается в initECSManager() для автоматической настройки
   */
  private autoRegisterClusters(): void {
    const clusterRegistry = ClusterRegistry.getInstance();
    const systemRegistry = SystemRegistry.getInstance();

    // Автоматически создать кластеры на основе метаданных систем
    clusterRegistry.autoCreateFromSystemMetadata(systemRegistry.getAll());

    // Зарегистрировать все кластеры
    for (const [name, cluster] of clusterRegistry.getAll()) {
      this.logger.info(`Auto-registered cluster: ${name} (${cluster.systemNames.length} systems)`);
    }

    this.logger.info(`Auto-registered ${clusterRegistry.size()} clusters`);
  }

  /**
   * Настройка подписок на события для event-driven систем
   */
  private setupEventSubscriptions(): void {
    // Подписываемся на Events.CallSystem для ручного вызова систем
    this.eventBus.on(Events.CallSystem, (payload) => {
      if (payload && 'systemName' in payload) {
        this.handleCallSystem(payload);
      }
    });

    this.logger.info('Event subscriptions setup for event-driven systems');
  }

  /**
   * Настройка подписки на LogicTick для автоматического обновления систем
   */
  private setupTickSubscription(): void {
    // Подписываемся на LogicTick события от TickManager
    this.eventBus.on(Events.LogicTick, (data) => {
      if (data && 'delta' in data) {
        // Обновляем системы каждый игровой тик
        this.scheduleManager.update(data.delta);
      }
    });

    this.logger.info('Tick subscription setup for automatic system updates');
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
    const registry = SystemRegistry.getInstance();
    const registeredSystem = registry.get(systemName);

    if (registeredSystem) {
      try {
        registeredSystem.system(this.world, 0); // delta = 0 для вызова по событию
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
        system(this.world, 0); // delta = 0 для вызова по событию
        this.logger.debug(`Executed event-driven system for event "${eventName}"`);
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
      this.eventBus.on(eventName, (payload) => {
        this.handleEventSystem(eventName, payload);
      });
    }
    this.eventSystemMap.get(eventName)!.push(system);
    this.logger.info(`Registered event-driven system for event "${eventName}"`);
  }

  /**
   * Метод для тестирования event-driven систем (Phase 3)
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
   * Метод для тестирования фабрик сущностей (Phase 4)
   * Создает тестовые сущности через зарегистрированные фабрики
   */
  testEntityFactories(): void {
    const registry = EntityFactoryRegistry.getInstance();

    this.logger.info('Testing entity factories...');

    // Тестируем все зарегистрированные фабрики
    for (const [name, factory] of registry.getAll()) {
      try {
        const entityId = factory.factory();
        this.logger.info(`Created entity via factory "${name}": entityId = ${entityId}`);
      } catch (error) {
        this.logger.error(`Error creating entity via factory "${name}":`, error as Error);
      }
    }

    this.logger.info(`Tested ${registry.size()} entity factories`);
  }

  /**
   * Метод для тестирования ScheduleManager (Phase 2)
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

export class ScheduleManager {
  private systems: SystemFunction[] = [];
  private intervalSystems: IntervalSystem[] = [];
  private clusterTimers: Map<string, number> = new Map();
  private gameTime: number = 0; // Накопленное игровое время для кластеров

  constructor(
    private world: World,
    private eventBus: EventBus,
    private systemRegistry: SystemRegistry,
    private clusterRegistry: ClusterRegistry,
  ) {}

  registerSystem(system: SystemFunction): void {
    this.systems.push(system);
    console.log('[ScheduleManager] Registered system');
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
    console.log(`[ScheduleManager] Registered interval system: ${name} (interval: ${interval}ms)`);
  }

  /**
   * Инициализация таймера для кластера
   */
  initClusterTimer(clusterName: string): void {
    this.clusterTimers.set(clusterName, 0);
  }

  /**
   * Обновление кластерной системы с интервалом
   */
  updateCluster(
    clusterName: string,
    systems: SystemFunction[],
    deltaTime: number,
    interval?: number,
  ): void {
    if (!interval) {
      // Выполнять каждый тик
      for (const system of systems) {
        try {
          system(this.world, deltaTime);
        } catch (error) {
          console.error(`[ScheduleManager] Error in cluster ${clusterName}:`, error as Error);
        }
      }
      return;
    }

    // Обновление с интервалом
    const currentTimer = this.clusterTimers.get(clusterName) || 0;
    const newTimer = currentTimer + deltaTime;

    if (newTimer >= interval) {
      for (const system of systems) {
        try {
          system(this.world, deltaTime);
        } catch (error) {
          console.error(`[ScheduleManager] Error in cluster ${clusterName}:`, error as Error);
        }
      }
      this.clusterTimers.set(clusterName, 0); // Сброс таймера
    } else {
      this.clusterTimers.set(clusterName, newTimer);
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

      // Выполнить каждую систему в кластере
      for (const systemName of cluster.systemNames) {
        const registeredSystem = this.systemRegistry.get(systemName);
        if (!registeredSystem) {
          console.warn(
            `[ScheduleManager] System "${systemName}" not found for cluster "${clusterName}"`,
          );
          continue;
        }

        const { system, metadata } = registeredSystem;

        // Проверить, включена ли система
        if (metadata.enabled === false) {
          continue; // Пропустить отключенную систему
        }

        // Проверить, является ли система интервальной
        if (metadata.interval && metadata.interval > 0) {
          // Интервальная система - проверить, пора ли выполнять
          const intervalSystem = this.intervalSystems.find((is) => is.name === systemName);
          if (intervalSystem && gameTime - intervalSystem.lastExecuted >= intervalSystem.interval) {
            try {
              system(this.world, deltaTime);
              intervalSystem.lastExecuted = gameTime;
            } catch (error) {
              console.error(
                `[ScheduleManager] Error in interval system "${systemName}" of cluster "${clusterName}":`,
                error,
              );
            }
          }
        } else {
          // Обычная система - выполнить каждый тик
          try {
            system(this.world, deltaTime);
          } catch (error) {
            console.error(
              `[ScheduleManager] Error in system "${systemName}" of cluster "${clusterName}":`,
              error,
            );
          }
        }
      }
    }
  }

  /**
   * Основное обновление - выполняет кластеры и интервальные системы
   */
  update(deltaTime: number): void {
    // Обновить игровое время (фиксированная величина за тик, независимо от скорости)
    this.gameTime += GAME_TIME_PER_TICK;

    // 1. Обновить кластеры (групповое выполнение обычных систем)
    this.updateClusters(deltaTime, this.gameTime);

    // 2. Обновить интервальные системы (централизованно)
    for (const intervalSystem of this.intervalSystems) {
      // Проверить, включена ли система
      const registeredSystem = this.systemRegistry.get(intervalSystem.name);
      if (registeredSystem && registeredSystem.metadata.enabled === false) {
        continue; // Пропустить отключенную систему
      }

      if (this.gameTime - intervalSystem.lastExecuted >= intervalSystem.interval) {
        try {
          intervalSystem.system(this.world, deltaTime);
          intervalSystem.lastExecuted = this.gameTime;
        } catch (error) {
          console.error(
            `[ScheduleManager] Error in interval system ${intervalSystem.name}:`,
            error,
          );
        }
      }
    }
  }

  getSystems(): readonly SystemFunction[] {
    return this.systems;
  }

  getIntervalSystems(): readonly IntervalSystem[] {
    return this.intervalSystems;
  }
}
