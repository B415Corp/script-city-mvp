import { EventBus } from '../event_bus/event_bus';
import BaseModule from './base_module';
import KekModule from './base_modules/kek_module';
import MapModule from './map_module/map_module';

export class ModuleManager {
  private scene!: Phaser.Scene;
  private eventBus!: EventBus;
  private baseModuleApi: Map<string, BaseModule> = new Map();
  private baseModules: (typeof BaseModule)[] = [KekModule, MapModule];

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    this.scene = scene;
    this.eventBus = eventBus;
  }

  public initBaseModules(): void {
    this.baseModules.forEach((module) => {
      this.baseModuleApi.set(module.name, new module(this.scene, this.eventBus));
    });
  }

  public getModuleApi(moduleName: string): BaseModule | undefined {
    return this.baseModuleApi.get(moduleName);
  }

  public getModulesNameList(): Array<string> {
    return [...this.baseModuleApi.keys()];
  }
}

export default ModuleManager;
