import BaseModule from './base_module';
import KekModule from './base_modules/kek_module';

export class ModuleManager {
  private scene!: Phaser.Scene;
  private baseModules: (typeof BaseModule)[] = [KekModule];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public initBaseModules(): void {
    this.baseModules.forEach((module) => {
      new module(this.scene);
    });
  }
}

export default ModuleManager;
