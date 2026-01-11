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

export class Core {
  private phaserConfig: Phaser.Types.Core.GameConfig;
  private phaser!: Phaser.Game; // definite assignment assertion - инициализируется в initPhaser
  private resizeHandler?: () => void;

  // Конфигурационный флаг для Phase 0 - отключает симуляцию
  private readonly enableSimulation: boolean = false;

  public moduleManager!: ModuleManager; // definite assignment assertion - инициализируется в initModules
  public ecsManager: ECSManager | null = null; // может быть null для Phase 0
  public eventBus!: EventBus; // definite assignment assertion - инициализируется в initEventBus
  public tickManager!: TickManager; // definite assignment assertion - инициализируется в initTickManager

  constructor(phaserConfig: Phaser.Types.Core.GameConfig) {
    this.phaserConfig = phaserConfig;
    this.setupResizeHandler(); // ← ИЗМЕНИТЬ
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

    // Очищаем moduleManager
    if (this.moduleManager) {
      // TODO: добавить destroy метод в ModuleManager если нужен
      this.moduleManager = undefined!;
    }

    // Уничтожаем ECSManager если он существует
    if (this.ecsManager) {
      // TODO: добавить destroy метод в ECSManager если нужен
      this.ecsManager = null;
    }

    // Уничтожаем tickManager
    if (this.tickManager) {
      // TODO: добавить destroy метод в TickManager если нужен
      this.tickManager = undefined!;
    }

    // Уничтожаем eventBus
    if (this.eventBus) {
      // TODO: добавить destroy метод в EventBus если нужен
      this.eventBus = undefined!;
    }

    // Уничтожаем Phaser
    if (this.phaser) {
      this.phaser.destroy(true);
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

  public async init(): Promise<void> {
    await this.initPhaser();
    await this.initEventBus();
    this.initTickManager();
    await this.initECSManager(); // Включено для работы дебаг панели ECS
    await this.initModules();
    this.startSimulation();
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
      this.tickManager = new TickManager(this.eventBus, 10);
      // Устанавливаем начальное время на 2:00 ночи (жители спят)
      this.tickManager.getTimeService().setTime(2 * 60); // 2:00 AM
    } catch (error) {
      throw new Error(`Failed to initialize TickManager: ${error}`);
    }
  }

  private async startSimulation(): Promise<void> {
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
