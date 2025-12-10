import { EventBus } from '../event_bus/event_bus';
import BaseModule from './base_module';
import KekModule from './base_modules/kek_module';

export class ModuleManager {
  private eventBus: EventBus;
  private baseModules: (typeof BaseModule)[] = [KekModule];

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.initbaseModules();
  }

  private initbaseModules(): void {
    this.baseModules.forEach((module) => {
      new module(this.eventBus);
    });
  }
}

export default ModuleManager;
