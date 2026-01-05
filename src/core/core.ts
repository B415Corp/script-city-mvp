import Phaser from 'phaser';
import ModuleManager from './modules/module_manager';
import { MainScene } from './scenes';
import { EventBus } from './event_bus/event_bus';
import { ECSManager } from './ecs/ecs_manager';
import { TickManager } from './tick/tick_manager';

export class Core {
  private phaserConfig!: Phaser.Types.Core.GameConfig;
  private phaser!: Phaser.Game | null;

  public moduleManager!: ModuleManager | null;
  public ecsManager!: ECSManager<Record<string, object>>;
  public eventBus!: EventBus;
  public tickManager!: TickManager;

  constructor(phaserConfig: Phaser.Types.Core.GameConfig) {
    this.phaserConfig = phaserConfig;

    window.addEventListener('resize', () => {
      this.phaser?.scale.resize(window.innerWidth, window.innerHeight);
    });
  }

  public async init(): Promise<void> {
    await this.initPhaser();
    await this.initEventBus();
    await this.initTickManager();
    await this.initECSManager();
    await this.initModules();
  }

  private async initEventBus(): Promise<void> {
    this.eventBus = new EventBus();
  }

  private async initModules(): Promise<void> {
    return new Promise((res) => {
      this.phaser?.events.once('ready', () => {
        const scene = this.phaser!.scene.getScene('main_scene') as MainScene;
        scene.init(this.eventBus, this.tickManager);
        this.moduleManager = new ModuleManager(scene, this.eventBus);
        this.moduleManager.init();
        res();
      });
    });
  }

  private async initPhaser(): Promise<void> {
    this.phaser = new Phaser.Game(this.phaserConfig);
  }

  private async initECSManager(): Promise<void> {
    this.ecsManager = new ECSManager<Record<string, object>>(this.eventBus, {}, {});
  }

  private async initTickManager(): Promise<void> {
    this.tickManager = new TickManager(this.eventBus, 10);
  }
}
