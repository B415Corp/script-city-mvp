import Phaser from 'phaser';
import ModuleManager from '../modules/module_manager';
import { PhaserConfig } from '@/main';

export class EventBus {
  private moduleManager!: ModuleManager | null;
  private phaserConfig!: PhaserConfig;

  public phaser!: Phaser.Game | null;

  constructor(phaserConfig: PhaserConfig) {
    console.log('EventBus init', this.phaser);
    this.phaserConfig = phaserConfig;

    window.addEventListener('resize', () => {
      this.phaser?.scale.resize(window.innerWidth, window.innerHeight);
    });
  }

  public async init(): Promise<void> {
    await this.initPhaser();
    await this.initModules();
  }

  private async initModules(): Promise<void> {
    return new Promise((res) => {
      this.phaser?.events.once('ready', () => {
        const scene = this.phaser!.scene.getScene('main_scene');
        this.moduleManager = new ModuleManager(scene);
        this.moduleManager.initBaseModules();
        res();
      });
    });
  }

  private async initPhaser(): Promise<void> {
    this.phaser = new Phaser.Game(this.phaserConfig);
  }
}
