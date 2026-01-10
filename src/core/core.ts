import Phaser from 'phaser';
import ModuleManager from './modules/module_manager';
import { MainScene } from './scenes';
import { EventBus } from './event_bus/event_bus';
import { ECSManager } from './ecs/ecs_manager';
import { TickManager } from './tick/tick_manager';
import { EntrySimulation } from './simulations/entry_simulation';

export class Core {
  private phaserConfig: Phaser.Types.Core.GameConfig;
  private phaser: Phaser.Game | null = null; // ← ДОБАВИТЬ = null
  private resizeHandler?: () => void;

  public moduleManager: ModuleManager | null = null; // ← ДОБАВИТЬ = null
  public ecsManager: ECSManager | null = null; // ← ДОБАВИТЬ = null
  public eventBus: EventBus | null = null; // ← ДОБАВИТЬ = null
  public tickManager: TickManager | null = null; // ← ДОБАВИТЬ = null

  constructor(phaserConfig: Phaser.Types.Core.GameConfig) {
    this.phaserConfig = phaserConfig;
    this.setupResizeHandler(); // ← ИЗМЕНИТЬ
  }

  // ← ДОБАВИТЬ новый метод
  private setupResizeHandler(): void {
    this.resizeHandler = (): void => {
      this.phaser?.scale.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  // ← ДОБАВИТЬ метод cleanup
  public destroy(): void {
    // Удаляем resize listener
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = undefined;
    }

    // Очищаем moduleManager
    this.moduleManager = null;

    // Уничтожаем Phaser
    this.phaser?.destroy(true);
    this.phaser = null;
  }

  public async init(): Promise<void> {
    await this.initPhaser();
    await this.initEventBus();
    this.initTickManager();
    this.initECSManager();
    await this.initModules();
    this.startSimulation();
  }

  private async initEventBus(): Promise<void> {
    this.eventBus = new EventBus();
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

          if (!this.ecsManager) {
            throw new Error('ECSManager not initialized');
          }

          scene.init(this.eventBus, this.tickManager);
          this.moduleManager = new ModuleManager(scene, this.eventBus, this.ecsManager, this.tickManager);
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
    this.phaser = new Phaser.Game(this.phaserConfig);
  }

  private async initECSManager(): Promise<void> {
    if (!this.eventBus || !this.tickManager) {
      throw new Error('EventBus and TickManager must be initialized before ECSManager');
    }
    this.ecsManager = new ECSManager(this.eventBus, this.tickManager);
  }

  private async initTickManager(): Promise<void> {
    if (!this.eventBus) {
      throw new Error('EventBus must be initialized before TickManager');
    }
    this.tickManager = new TickManager(this.eventBus, 10);
    // Устанавливаем начальное время на 2:00 ночи (жители спят)
    this.tickManager.getTimeService().setTime(2 * 60); // 2:00 AM
  }

  private async startSimulation(): Promise<void> {
    if (!this.ecsManager || !this.eventBus || !this.tickManager) {
      throw new Error('All managers must be initialized before starting simulation');
    }
    const entrySimulation = new EntrySimulation(this.ecsManager, this.eventBus, this.tickManager);
    entrySimulation.start();
  }
}
