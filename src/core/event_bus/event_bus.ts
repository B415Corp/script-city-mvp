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
    new ModuleManager(this);

    window.addEventListener('resize', () => {
      this.phaser?.scale.resize(window.innerWidth, window.innerHeight);
    });
  }

  public async init(): Promise<void> {
    this.phaser = new Phaser.Game(config);

    // this.moduleManager = new ModuleManager(this);
  }

  public getScene(sceneId: string): void {
    this.phaser?.events.once('create', () => {
      const scene = this.phaser!.scene.getScenes();
      console.log('getScene', scene);
    });
  }
}
