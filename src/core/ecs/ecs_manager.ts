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
  private logger: Logger;

  constructor(
    private eventBus: EventBus,
    private tickManager: TickManager,
  ) {
    this.logger = Logger.create('ECSManager');
    this.logger.info('ECSManager initialized (Phase 2 - with ScheduleManager)');
    this.world = createWorld();
    this.scheduleManager = new ScheduleManager(this.world, this.eventBus);
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

    // Регистрируем все системы в ScheduleManager
    for (const [name, registeredSystem] of registry.getAll()) {
      const { system, metadata } = registeredSystem;

      // Регистрируем систему в зависимости от наличия интервала
      if (metadata.interval && metadata.interval > 0) {
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
