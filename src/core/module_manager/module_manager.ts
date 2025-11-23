export class ModuleManager {
  constructor() {
    console.warn('ModuleManager initialized');
  }

  registerModule(module: unknown): void {
    console.warn('ModuleManager registered module', module);
  }

  initializeModules(): Promise<void> {
    console.warn('ModuleManager initialized modules');
    return Promise.resolve();
  }

  clear(): void {
    console.warn('ModuleManager cleared');
  }
}
