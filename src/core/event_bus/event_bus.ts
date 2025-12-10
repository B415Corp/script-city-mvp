import Phaser from 'phaser';
import MainScene from '../scenes/main_scene';
import ModuleManager from '../modules/module_manager';

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  scene: MainScene,
};

export class EventBus {
  public phaser!: Phaser.Game | null;
  private moduleManager!: ModuleManager | null;

  constructor() {
    console.log('EventBus init', this.phaser);

    window.addEventListener('resize', () => {
      this.phaser?.scale.resize(window.innerWidth, window.innerHeight);
    });
  }

  public async init(): Promise<void> {
    this.phaser = new Phaser.Game(config);
    await this.initModules();
  }

  private initModules(): Promise<void> {
    return new Promise((res) => {
      this.phaser?.events.once('ready', () => {
        const scene = this.phaser!.scene.getScene('main_scene');
        this.moduleManager = new ModuleManager(scene);
        res();
      });
    });
  }
}
