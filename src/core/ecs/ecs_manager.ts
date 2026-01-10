import { createWorld, World } from 'bitecs';
import { EventBus } from '../event_bus/event_bus';
import { TickManager } from '../tick/tick_manager';
import { Logger } from '../utils/logger';

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
    this.scheduleManager = new ScheduleManager(this.world, this.eventBus);

    // Подписываемся на события для event-driven систем
    this.setupEventSubscriptions();
  }

  /**
   * Возвращает BitECS world (для Phase 0 - пустой)
   */
  getWorld(): World {
    return this.world;
  }

  /**
   * Возвращает статистику ECS (расширенная для Phase 2)
   */
  getStats(): any {
    const { ComponentRegistry, SystemRegistry, ClusterRegistry } = require('./registry');
    const componentRegistry = ComponentRegistry.getInstance();
    const systemRegistry = SystemRegistry.getInstance();
    const clusterRegistry = ClusterRegistry.getInstance();

    // Собираем информацию об event-driven системах
    const eventSystems: Record<string, string[]> = {};
    for (const [eventName, systems] of this.eventSystemMap) {
      eventSystems[eventName] = systems.map(() => 'event-driven'); // Пока просто помечаем как event-driven
    }

    return {
      totalSystemsCount: this.scheduleManager.getSystems().length + this.scheduleManager.getIntervalSystems().length,
      clustersCount: clusterRegistry.size(),
      systems: Array.from(systemRegistry.getAll().keys()),
      clusters: Object.fromEntries(clusterRegistry.getAll()),
      entityCount: 0,
      entityCountsByType: {},
      gameTime: 0,
      timeData: null,
      totalEntities: 0,
      components: Array.from(componentRegistry.getAll().keys()),
      intervalSystems: this.scheduleManager.getIntervalSystems().map(s => s.name),
      eventSystems,
    };
  }

  // В Phase 0 остальные методы не нужны - ECS отключен

  /**
   * Автоматическая регистрация компонентов из ComponentRegistry
   * Вызывается в initECSManager() для автоматической настройки
   */
  private autoRegisterComponents(): void {
    const { ComponentRegistry } = require('./registry/component_registry');
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
    const { SystemRegistry } = require('./registry/system_registry');
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
        this.logger.info(`Auto-registered event-driven system: ${name} (events: ${metadata.eventTriggers.join(', ')})`);
      }
      // Проверяем интервал для интервальных систем
      else if (metadata.interval && metadata.interval > 0) {
        // Система с интервалом
        this.scheduleManager.registerIntervalSystem(name, system, metadata.interval);
        this.logger.info(`Auto-registered interval system: ${name} (${metadata.interval}ms, cluster: ${metadata.cluster || 'none'})`);
      } else {
        // Обычная система (каждый тик)
        this.scheduleManager.registerSystem(system);
        this.logger.info(`Auto-registered system: ${name} (every tick, cluster: ${metadata.cluster || 'none'})`);
      }
    }

    this.logger.info(`Auto-registered ${registry.size()} systems`);
  }

  /**
   * Автоматическая регистрация кластеров из ClusterRegistry
   * Вызывается в initECSManager() для автоматической настройки
   */
  private autoRegisterClusters(): void {
    const { ClusterRegistry, SystemRegistry } = require('./registry/cluster_registry');
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
    this.eventBus.on('CallSystem', (payload) => {
      if (payload && payload.systemName) {
        this.handleCallSystem(payload.systemName, payload.data);
      }
    });

    this.logger.info('Event subscriptions setup for event-driven systems');
  }

  /**
   * Обработчик для вызова системы по имени (Events.CallSystem)
   */
  private handleCallSystem(systemName: string, data?: any): void {
    // Находим систему в реестре и выполняем её
    const { SystemRegistry } = require('./registry/system_registry');
    const registry = SystemRegistry.getInstance();
    const registeredSystem = registry.get(systemName);

    if (registeredSystem) {
      try {
        registeredSystem.system(this.world, 0); // delta = 0 для вызова по событию
        this.logger.debug(`Executed system "${systemName}" via CallSystem event`);
      } catch (error) {
        this.logger.error(`Error executing system "${systemName}":`, error);
      }
    } else {
      this.logger.warn(`System "${systemName}" not found for CallSystem event`);
    }
  }

  /**
   * Обработчик для event-driven систем
   * Выполняет все системы, подписанные на данное событие
   */
  private handleEventSystem(eventName: string, payload?: any): void {
    const systems = this.eventSystemMap.get(eventName);
    if (!systems || systems.length === 0) {
      return; // Нет систем, подписанных на это событие
    }

    for (const system of systems) {
      try {
        system(this.world, 0); // delta = 0 для вызова по событию
        this.logger.debug(`Executed event-driven system for event "${eventName}"`);
      } catch (error) {
        this.logger.error(`Error in event-driven system for "${eventName}":`, error);
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
    setTimeout(() => this.eventBus.emit('test:event', { testData: 'from test' }), 1000);
    setTimeout(() => this.eventBus.emit('custom:action', { action: 'test_action' }), 2000);
    setTimeout(() => this.eventBus.emit('nonexistent:event', {}), 3000); // Это событие не должно вызвать системы

    this.logger.info('Test events scheduled (1s: test:event, 2s: custom:action, 3s: nonexistent:event)');
  }

  /**
   * Метод для тестирования фабрик сущностей (Phase 4)
   * Создает тестовые сущности через зарегистрированные фабрики
   */
  testEntityFactories(): void {
    const { EntityFactoryRegistry } = require('./registry/entity_factory_registry');
    const registry = EntityFactoryRegistry.getInstance();

    this.logger.info('Testing entity factories...');

    // Тестируем все зарегистрированные фабрики
    for (const [name, factory] of registry.getAll()) {
      try {
        const entityId = factory.factory();
        this.logger.info(`Created entity via factory "${name}": entityId = ${entityId}`);
      } catch (error) {
        this.logger.error(`Error creating entity via factory "${name}":`, error);
      }
    }

    this.logger.info(`Tested ${registry.size()} entity factories`);
  }

  /**
   * Метод для тестирования ScheduleManager (Phase 2)
   * Запускает тестовый цикл обновления систем
   */
  testScheduleManager(duration = 5000): void {
    this.logger.info(`Starting ScheduleManager test for ${duration}ms...`);

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 100;
      this.scheduleManager.update(100); // 100ms delta

      if (elapsed >= duration) {
        clearInterval(interval);
        this.logger.info('ScheduleManager test completed');
      }
    }, 100);
  }
}

// ✅ Расширенный ScheduleManager для Phase 2 с поддержкой интервалов
export type SystemFunction = (world: any, delta?: number) => void;

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

  constructor(
    private world: World,
    private eventBus: EventBus,
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
      lastExecuted: 0,
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
  updateCluster(clusterName: string, systems: SystemFunction[], interval?: number, deltaTime: number): void {
    if (!interval) {
      // Выполнять каждый тик
      for (const system of systems) {
        try {
          system(this.world, deltaTime);
        } catch (error) {
          console.error(`[ScheduleManager] Error in cluster ${clusterName}:`, error);
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
          console.error(`[ScheduleManager] Error in cluster ${clusterName}:`, error);
        }
      }
      this.clusterTimers.set(clusterName, 0); // Сброс таймера
    } else {
      this.clusterTimers.set(clusterName, newTimer);
    }
  }

  /**
   * Основное обновление - выполняет обычные системы и интервальные системы
   */
  update(deltaTime: number): void {
    // Обновить обычные системы
    for (const system of this.systems) {
      try {
        system(this.world, deltaTime);
      } catch (error) {
        console.error('[ScheduleManager] Error in system:', error);
      }
    }

    // Обновить интервальные системы
    const currentTime = Date.now();
    for (const intervalSystem of this.intervalSystems) {
      if (currentTime - intervalSystem.lastExecuted >= intervalSystem.interval) {
        try {
          intervalSystem.system(this.world, deltaTime);
          intervalSystem.lastExecuted = currentTime;
        } catch (error) {
          console.error(`[ScheduleManager] Error in interval system ${intervalSystem.name}:`, error);
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
