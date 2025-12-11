import { EventBus } from '../event_bus/event_bus';
import BaseModule from './base_module';
import KekModule from './base_modules/kek_module';
import MapModule from './map_module/map_module';

export class ModuleManager {
  private scene!: Phaser.Scene;
  private eventBus!: EventBus;
  private baseModules: (typeof BaseModule)[] = [KekModule, MapModule];

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    this.scene = scene;
    this.eventBus = eventBus;
  }

  public initBaseModules(): void {
    this.baseModules.forEach((module) => {
      new module(this.scene, this.eventBus);
    });
  }
}

export default ModuleManager;
