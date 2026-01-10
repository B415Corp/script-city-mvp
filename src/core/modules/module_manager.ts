import { EventBus } from '../event_bus/event_bus';
import { ECSManager } from '../ecs/ecs_manager';
import { TickManager } from '../tick/tick_manager';
import KekModule from './custom_modules/kek_module';
import MapModule from './base_modules/map_module/map_module';
import ToolbarModule from './base_modules/toolbar_module/toolbar_module';
import { ToolsModule } from './base_modules/tools_module/tools_module';
import { BaseModule, CustomModule } from './extends';
import { DebugModule } from './base_modules/debug_module/debug_module';

// названия базовых модулей с их классами
const baseModuleRegistry = {
  MapModule: MapModule,
  ToolsModule: ToolsModule,
  ToolbarModule: ToolbarModule,
  DebugModule: DebugModule,
} as const;

// названия кастомных модулей с их классами
const customModuleRegistry = {
  KekModule: KekModule,
} as const;

// названия модулей
type BaseModuleName = keyof typeof baseModuleRegistry;
type CustomModuleName = keyof typeof customModuleRegistry;

export class ModuleManager {
  private scene!: Phaser.Scene;
  private eventBus!: EventBus;
  private ecsManager: ECSManager | null;
  private tickManager!: TickManager;

  // api модулей
  private baseModuleApi: Map<string, BaseModule> = new Map();
  private customModuleApi: Map<string, CustomModule> = new Map();

  // регистры модулей
  private baseModules = baseModuleRegistry;
  private customModules = customModuleRegistry;

  constructor(
    scene: Phaser.Scene,
    eventBus: EventBus,
    ecsManager: ECSManager | null, // Временно null для Phase 0
    tickManager: TickManager,
  ) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.ecsManager = ecsManager;
    this.tickManager = tickManager;
  }

  public init(): void {
    this.initBaseModules();
    this.initCustomModules();
  }

  // инициализация базовых модулей в порядке очереди
  private initBaseModules(): void {
    Object.entries(this.baseModules).forEach(([name, ModuleClass]) => {
      // DebugModule получает ECSManager и TickManager для доступа к статистике
      let module: BaseModule;
      if (name === 'DebugModule') {
        // Для Phase 0 передаем null вместо ECSManager
        module = new (ModuleClass as new (
          scene: Phaser.Scene,
          eventBus: EventBus,
          ecsManager: ECSManager | null,
          tickManager: TickManager,
        ) => DebugModule)(this.scene, this.eventBus, this.ecsManager, this.tickManager);
      } else {
        module = new (ModuleClass as new (scene: Phaser.Scene, eventBus: EventBus) => BaseModule)(
          this.scene,
          this.eventBus,
        );
      }
      this.baseModuleApi.set(name, module);
    });
  }

  // инициализация кастомных модулей в порядке очереди
  private initCustomModules(): void {
    Object.entries(this.customModules).forEach(([name, ModuleClass]) => {
      this.customModuleApi.set(name, new ModuleClass(this.scene, this.eventBus));
    });
  }

  // получить базовый модуль по названию
  public getBaseModuleApi(moduleName: BaseModuleName): BaseModule | undefined {
    return this.baseModuleApi.get(moduleName);
  }

  // получить кастомный модуль по названию
  public getCustomModuleApi(moduleName: CustomModuleName): CustomModule | undefined {
    return this.customModuleApi.get(moduleName);
  }

  // включить/выключить кастомный модуль
  public setCustomModuleEnabled(moduleName: CustomModuleName, enabled: boolean): boolean {
    const module = this.customModuleApi.get(moduleName);
    if (module) {
      enabled ? module.enable() : module.disable();
      return true;
    }
    return false;
  }

  // проверить статус модуля
  public isBaseModuleEnabled(moduleName: BaseModuleName): boolean {
    const module = this.baseModuleApi.get(moduleName);
    return module?.enabled ?? false;
  }

  public isCustomModuleEnabled(moduleName: CustomModuleName): boolean {
    const module = this.customModuleApi.get(moduleName);
    return module?.enabled ?? false;
  }
}

export default ModuleManager;
