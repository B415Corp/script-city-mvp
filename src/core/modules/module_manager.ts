import { EventBus } from '../event_bus/event_bus';
import BaseModule from './base_module';
import KekModule from './base_modules/kek_module';
import MapModule from './map_module/map_module';

// названия модулей с их классами
const moduleRegistry = {
  KekModule: KekModule,
  MapModule: MapModule,
} as const;

// названия модулей
type ModuleName = keyof typeof moduleRegistry;

export class ModuleManager {
  private scene!: Phaser.Scene;
  private eventBus!: EventBus;
  private baseModuleApi: Map<string, BaseModule> = new Map();
  private baseModules = moduleRegistry;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    this.scene = scene;
    this.eventBus = eventBus;
  }

  // инициализация модулей в порядке очереди
  public initBaseModules(): void {
    Object.entries(this.baseModules).forEach(([name, ModuleClass]) => {
      this.baseModuleApi.set(name, new ModuleClass(this.scene, this.eventBus));
    });
  }

  // получить модуль по названию
  public getModuleApi(moduleName: ModuleName): BaseModule | undefined {
    return this.baseModuleApi.get(moduleName);
  }
}

export default ModuleManager;
