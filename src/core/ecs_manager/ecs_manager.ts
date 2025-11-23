export class ECSManager {
  constructor() {
    console.warn('ECSManager initialized');
  }

  createEntity(): void {
    console.warn('ECSManager created entity');
  }

  clear(): void {
    console.warn('ECSManager cleared');
  }

  destroyEntity(entity: unknown): void {
    console.warn('ECSManager destroyed entity', entity);
  }

  hasEntity(entity: unknown): boolean {
    console.warn('ECSManager has entity', entity);
    return true;
  }
}
