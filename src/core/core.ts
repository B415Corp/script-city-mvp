import Phaser from 'phaser';
import ModuleManager from './modules/module_manager';
import { MainScene } from './scenes';
import { EventBus } from './event_bus/event_bus';
import { ECSManager } from './ecs/ecs_manager';
import { TickManager } from './tick/tick_manager';
import { EntrySimulation } from './simulations/entry_simulation';
import { ComponentRegistry } from './ecs/registry/component_registry';
import { SystemRegistry } from './ecs/registry/system_registry';
import { ClusterRegistry } from './ecs/registry/cluster_registry';
import { EntityFactoryRegistry } from './ecs/registry/entity_factory_registry';
import { GameSpeeds } from './tick/types';

// Фабрики зависимостей для Dependency Injection
export interface ICoreDependencies {
  phaserFactory?: () => Phaser.Game;
  eventBusFactory?: () => EventBus;
  tickManagerFactory?: (eventBus: EventBus, initialSpeed?: GameSpeeds) => TickManager;
  ecsManagerFactory?: (eventBus: EventBus, tickManager: TickManager) => ECSManager;
  moduleManagerFactory?: (
    scene: MainScene,
    eventBus: EventBus,
    ecsManager: ECSManager | null,
    tickManager: TickManager,
  ) => ModuleManager;
  entrySimulationFactory?: (
    ecsManager: ECSManager,
    eventBus: EventBus,
    tickManager: TickManager,
  ) => EntrySimulation;
}

export class Core {
  private phaserConfig: Phaser.Types.Core.GameConfig;
  private phaser?: Phaser.Game;
  private resizeHandler?: () => void;

  // Конфигурационный флаг для Phase 0 - отключает симуляцию
  private readonly enableSimulation: boolean = false;

  public moduleManager?: ModuleManager;
  public ecsManager: ECSManager | null = null;
  public eventBus?: EventBus;
  public tickManager?: TickManager;

  // Фабрики зависимостей с дефолтными значениями
  private phaserFactory: () => Phaser.Game;
  private eventBusFactory: () => EventBus;
  private tickManagerFactory: (eventBus: EventBus, initialSpeed?: GameSpeeds) => TickManager;
  private ecsManagerFactory: (eventBus: EventBus, tickManager: TickManager) => ECSManager;
  private moduleManagerFactory: (
    scene: MainScene,
    eventBus: EventBus,
    ecsManager: ECSManager | null,
    tickManager: TickManager,
  ) => ModuleManager;
  private entrySimulationFactory: (
    ecsManager: ECSManager,
    eventBus: EventBus,
    tickManager: TickManager,
  ) => EntrySimulation;

  constructor(phaserConfig: Phaser.Types.Core.GameConfig, dependencies: ICoreDependencies = {}) {
    this.phaserConfig = phaserConfig;

    // Настраиваем фабрики с дефолтными значениями
    this.phaserFactory = dependencies.phaserFactory || (() => new Phaser.Game(this.phaserConfig));
    this.eventBusFactory = dependencies.eventBusFactory || (() => new EventBus());
    this.tickManagerFactory =
      dependencies.tickManagerFactory ||
      ((eventBus: EventBus, initialSpeed: GameSpeeds = GameSpeeds.NORMAL): TickManager =>
        new TickManager(eventBus, initialSpeed));
    this.ecsManagerFactory =
      dependencies.ecsManagerFactory ||
      ((eventBus: EventBus, tickManager: TickManager): ECSManager =>
        new ECSManager(eventBus, tickManager));
    this.moduleManagerFactory =
      dependencies.moduleManagerFactory ||
      ((
        scene: MainScene,
        eventBus: EventBus,
        ecsManager: ECSManager | null,
        tickManager: TickManager,
      ): ModuleManager => new ModuleManager(scene, eventBus, ecsManager, tickManager));
    this.entrySimulationFactory =
      dependencies.entrySimulationFactory ||
      ((ecsManager: ECSManager, eventBus: EventBus, tickManager: TickManager): EntrySimulation =>
        new EntrySimulation(ecsManager, eventBus, tickManager));

    this.setupResizeHandler();
  }

  private setupResizeHandler(): void {
    this.resizeHandler = (): void => {
      if (this.phaser) {
        this.phaser.scale.resize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  public destroy(): void {
    // Удаляем resize listener
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = undefined;
    }

    // Очищаем moduleManager с error handling
    if (this.moduleManager) {
      try {
        this.moduleManager.destroy();
      } catch (error) {
        console.error('[Core] Error destroying ModuleManager:', error);
      }
      this.moduleManager = undefined!;
    }

    // Уничтожаем ECSManager если он существует с error handling
    if (this.ecsManager) {
      try {
        this.ecsManager.destroy();
      } catch (error) {
        console.error('[Core] Error destroying ECSManager:', error);
      }
      this.ecsManager = null;
    }

    // Уничтожаем tickManager с error handling
    if (this.tickManager) {
      try {
        this.tickManager.destroy();
      } catch (error) {
        console.error('[Core] Error destroying TickManager:', error);
      }
      this.tickManager = undefined!;
    }

    // Уничтожаем eventBus с error handling
    if (this.eventBus) {
      try {
        this.eventBus.clear(); // Используем существующий метод clear()
      } catch (error) {
        console.error('[Core] Error destroying EventBus:', error);
      }
      this.eventBus = undefined!;
    }

    // Уничтожаем Phaser последним с error handling
    if (this.phaser) {
      try {
        this.phaser.destroy(true);
      } catch (error) {
        console.error('[Core] Error destroying Phaser:', error);
      }
      this.phaser = undefined!;
    }
  }

  /**
   * Высокоуровневый API для доступа к реестрам ECS (Phase 4)
   * Предоставляет доступ к компонентам, системам, кластерам и фабрикам для отладки
   */
  get ecsRegistries(): {
    components: () => ComponentRegistry;
    systems: () => SystemRegistry;
    clusters: () => ClusterRegistry;
    entityFactories: () => EntityFactoryRegistry;
  } | null {
    if (!this.ecsManager) {
      return null;
    }
    return {
      components: (): ComponentRegistry => ComponentRegistry.getInstance(),
      systems: (): SystemRegistry => SystemRegistry.getInstance(),
      clusters: (): ClusterRegistry => ClusterRegistry.getInstance(),
      entityFactories: (): EntityFactoryRegistry => EntityFactoryRegistry.getInstance(),
    };
  }

  // Основной метод инициализации
  public async init(): Promise<void> {
    await this.initializePhaser();
    await this.initializeEventBus();
    this.initializeTickManager();
    await this.initializeECSManager();
    await this.initializeModules();
    this.startSimulation();
  }

  // Отдельные методы инициализации для тестирования
  public async initializePhaser(): Promise<void> {
    try {
      this.phaser = this.phaserFactory();
    } catch (error) {
      throw new Error(`Failed to initialize Phaser: ${error}`);
    }
  }

  public async initializeEventBus(): Promise<void> {
    try {
      this.eventBus = this.eventBusFactory();
    } catch (error) {
      throw new Error(`Failed to initialize EventBus: ${error}`);
    }
  }

  public initializeTickManager(): void {
    try {
      if (!this.eventBus) {
        throw new Error('EventBus must be initialized before TickManager');
      }
      this.tickManager = this.tickManagerFactory(this.eventBus, GameSpeeds.NORMAL);
      // Устанавливаем начальное время на 2:00 ночи (жители спят)
      this.tickManager.getTimeService().setTime(2 * 60); // 2:00 AM
    } catch (error) {
      throw new Error(`Failed to initialize TickManager: ${error}`);
    }
  }

  public async initializeECSManager(): Promise<void> {
    try {
      if (!this.eventBus || !this.tickManager) {
        throw new Error('EventBus and TickManager must be initialized before ECSManager');
      }
      this.ecsManager = this.ecsManagerFactory(this.eventBus, this.tickManager);
    } catch (error) {
      throw new Error(`Failed to initialize ECSManager: ${error}`);
    }
  }

  public async initializeModules(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.phaser) {
        return reject(new Error('Phaser not initialized'));
      }

      this.phaser.events.once('ready', () => {
        try {
          if (!this.phaser) {
            throw new Error('Phaser is null');
          }

          const scene = this.phaser.scene.getScene('main_scene') as MainScene;

          if (!scene) {
            throw new Error('MainScene not found');
          }

          if (!this.eventBus) {
            throw new Error('EventBus not initialized');
          }

          if (!this.tickManager) {
            throw new Error('TickManager not initialized');
          }

          scene.init(this.eventBus, this.tickManager);
          this.moduleManager = this.moduleManagerFactory(
            scene,
            this.eventBus,
            this.ecsManager,
            this.tickManager,
          );
          this.moduleManager.init();
          scene.setModuleManager(this.moduleManager);

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private async initEventBus(): Promise<void> {
    try {
      this.eventBus = new EventBus();
    } catch (error) {
      throw new Error(`Failed to initialize EventBus: ${error}`);
    }
  }

  private async initModules(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.phaser) {
        return reject(new Error('Phaser not initialized'));
      }

      this.phaser.events.once('ready', () => {
        try {
          // ← УБРАТЬ ! и добавить проверки
          if (!this.phaser) {
            throw new Error('Phaser is null');
          }

          const scene = this.phaser.scene.getScene('main_scene') as MainScene;

          if (!scene) {
            throw new Error('MainScene not found');
          }

          if (!this.eventBus) {
            throw new Error('EventBus not initialized');
          }

          if (!this.tickManager) {
            throw new Error('TickManager not initialized');
          }

          // В Phase 0 ECSManager может быть null
          // if (!this.ecsManager) {
          //   throw new Error('ECSManager not initialized');
          // }

          scene.init(this.eventBus, this.tickManager);
          this.moduleManager = new ModuleManager(
            scene,
            this.eventBus,
            this.ecsManager,
            this.tickManager,
          );
          this.moduleManager.init();
          scene.setModuleManager(this.moduleManager);

          resolve();
        } catch (error) {
          reject(error); // ← ДОБАВИТЬ обработку ошибок
        }
      });
    });
  }

  private async initPhaser(): Promise<void> {
    try {
      this.phaser = new Phaser.Game(this.phaserConfig);
    } catch (error) {
      throw new Error(`Failed to initialize Phaser: ${error}`);
    }
  }

  private async initECSManager(): Promise<void> {
    try {
      if (!this.eventBus || !this.tickManager) {
        throw new Error('EventBus and TickManager must be initialized before ECSManager');
      }
      this.ecsManager = new ECSManager(this.eventBus, this.tickManager);
    } catch (error) {
      throw new Error(`Failed to initialize ECSManager: ${error}`);
    }
  }

  private initTickManager(): void {
    try {
      if (!this.eventBus) {
        throw new Error('EventBus must be initialized before TickManager');
      }
      this.tickManager = new TickManager(this.eventBus, GameSpeeds.NORMAL);
      // Устанавливаем начальное время на 2:00 ночи (жители спят)
      this.tickManager.getTimeService().setTime(2 * 60); // 2:00 AM
    } catch (error) {
      throw new Error(`Failed to initialize TickManager: ${error}`);
    }
  }

  public async startSimulation(): Promise<void> {
    if (!this.enableSimulation) {
      console.log('Simulation disabled for Phase 0');
      return;
    }

    try {
      if (!this.ecsManager || !this.eventBus || !this.tickManager) {
        throw new Error('All managers must be initialized before starting simulation');
      }
      const entrySimulation = new EntrySimulation(this.ecsManager, this.eventBus, this.tickManager);
      entrySimulation.start();
    } catch (error) {
      throw new Error(`Failed to start simulation: ${error}`);
    }
  }
}

// Builder для создания тестовых экземпляров Core
export class CoreBuilder {
  private phaserConfig: Phaser.Types.Core.GameConfig;
  private dependencies: ICoreDependencies = {};

  constructor(
    phaserConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      scene: [],
    },
  ) {
    this.phaserConfig = phaserConfig;
  }

  withPhaser(phaser: Phaser.Game): this {
    this.dependencies.phaserFactory = () => phaser;
    return this;
  }

  withEventBus(eventBus: EventBus): this {
    this.dependencies.eventBusFactory = () => eventBus;
    return this;
  }

  withTickManager(tickManager: TickManager): this {
    this.dependencies.tickManagerFactory = () => tickManager;
    return this;
  }

  withTickManagerFactory(
    factory: (eventBus: EventBus, initialSpeed?: GameSpeeds) => TickManager,
  ): this {
    this.dependencies.tickManagerFactory = factory;
    return this;
  }

  withECSManager(ecsManager: ECSManager): this {
    this.dependencies.ecsManagerFactory = () => ecsManager;
    return this;
  }

  withModuleManager(moduleManager: ModuleManager): this {
    this.dependencies.moduleManagerFactory = () => moduleManager;
    return this;
  }

  withEntrySimulation(entrySimulation: EntrySimulation): this {
    this.dependencies.entrySimulationFactory = () => entrySimulation;
    return this;
  }

  withPhaserFactory(factory: () => Phaser.Game): this {
    this.dependencies.phaserFactory = factory;
    return this;
  }

  withEventBusFactory(factory: () => EventBus): this {
    this.dependencies.eventBusFactory = factory;
    return this;
  }

  withECSManagerFactory(
    factory: (eventBus: EventBus, tickManager: TickManager) => ECSManager,
  ): this {
    this.dependencies.ecsManagerFactory = factory;
    return this;
  }

  withModuleManagerFactory(
    factory: (
      scene: MainScene,
      eventBus: EventBus,
      ecsManager: ECSManager | null,
      tickManager: TickManager,
    ) => ModuleManager,
  ): this {
    this.dependencies.moduleManagerFactory = factory;
    return this;
  }

  withEntrySimulationFactory(
    factory: (
      ecsManager: ECSManager,
      eventBus: EventBus,
      tickManager: TickManager,
    ) => EntrySimulation,
  ): this {
    this.dependencies.entrySimulationFactory = factory;
    return this;
  }

  build(): Core {
    return new Core(this.phaserConfig, this.dependencies);
  }
}
