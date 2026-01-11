import Phaser from 'phaser';
import ModuleManager from '../modules/module_manager';
import { MainScene } from '../scenes';
import { EventBus } from '../event_bus/event_bus';
import { ECSManager } from '../ecs/ecs_manager';
import { TickManager } from '../tick/tick_manager';
import { EntrySimulation } from '../simulations/entry_simulation';
import { GameSpeeds } from '../tick/types';

// Методы инициализации для Core
export class CoreInitialization {
  private phaser?: Phaser.Game;
  private eventBus?: EventBus;
  private tickManager?: TickManager;
  private ecsManager: ECSManager | null = null;
  private moduleManager?: ModuleManager;

  // Фабрики зависимостей
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

  // Конфигурационный флаг для Phase 0 - отключает симуляцию
  private readonly enableSimulation: boolean;

  constructor(
    phaser: Phaser.Game | undefined,
    eventBus: EventBus | undefined,
    tickManager: TickManager | undefined,
    ecsManager: ECSManager | null,
    moduleManager: ModuleManager | undefined,
    phaserFactory: () => Phaser.Game,
    eventBusFactory: () => EventBus,
    tickManagerFactory: (eventBus: EventBus, initialSpeed?: GameSpeeds) => TickManager,
    ecsManagerFactory: (eventBus: EventBus, tickManager: TickManager) => ECSManager,
    moduleManagerFactory: (
      scene: MainScene,
      eventBus: EventBus,
      ecsManager: ECSManager | null,
      tickManager: TickManager,
    ) => ModuleManager,
    entrySimulationFactory: (
      ecsManager: ECSManager,
      eventBus: EventBus,
      tickManager: TickManager,
    ) => EntrySimulation,
    enableSimulation: boolean = false,
  ) {
    this.phaser = phaser;
    this.eventBus = eventBus;
    this.tickManager = tickManager;
    this.ecsManager = ecsManager;
    this.moduleManager = moduleManager;
    this.phaserFactory = phaserFactory;
    this.eventBusFactory = eventBusFactory;
    this.tickManagerFactory = tickManagerFactory;
    this.ecsManagerFactory = ecsManagerFactory;
    this.moduleManagerFactory = moduleManagerFactory;
    this.entrySimulationFactory = entrySimulationFactory;
    this.enableSimulation = enableSimulation;
  }

  // Основной метод инициализации
  async init(): Promise<void> {
    await this.initializePhaser();
    await this.initializeEventBus();
    this.initializeTickManager();
    await this.initializeECSManager();
    await this.initializeModules();
    this.startSimulation();
  }

  // Отдельные методы инициализации для тестирования
  async initializePhaser(): Promise<void> {
    try {
      this.phaser = this.phaserFactory();
    } catch (error) {
      throw new Error(`Failed to initialize Phaser: ${error}`);
    }
  }

  async initializeEventBus(): Promise<void> {
    try {
      this.eventBus = this.eventBusFactory();
    } catch (error) {
      throw new Error(`Failed to initialize EventBus: ${error}`);
    }
  }

  initializeTickManager(): void {
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

  async initializeECSManager(): Promise<void> {
    try {
      if (!this.eventBus || !this.tickManager) {
        throw new Error('EventBus and TickManager must be initialized before ECSManager');
      }
      this.ecsManager = this.ecsManagerFactory(this.eventBus, this.tickManager);
    } catch (error) {
      throw new Error(`Failed to initialize ECSManager: ${error}`);
    }
  }

  async initializeModules(): Promise<void> {
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

  async startSimulation(): Promise<void> {
    if (!this.enableSimulation) {
      console.log('Simulation disabled for Phase 0');
      return;
    }

    try {
      if (!this.ecsManager || !this.eventBus || !this.tickManager) {
        throw new Error('All managers must be initialized before starting simulation');
      }
      const entrySimulation = this.entrySimulationFactory(
        this.ecsManager,
        this.eventBus,
        this.tickManager,
      );
      entrySimulation.start();
    } catch (error) {
      throw new Error(`Failed to start simulation: ${error}`);
    }
  }

  // Геттеры для доступа к полям
  getPhaser(): Phaser.Game | undefined {
    return this.phaser;
  }

  getEventBus(): EventBus | undefined {
    return this.eventBus;
  }

  getTickManager(): TickManager | undefined {
    return this.tickManager;
  }

  getECSManager(): ECSManager | null {
    return this.ecsManager;
  }

  getModuleManager(): ModuleManager | undefined {
    return this.moduleManager;
  }
}
