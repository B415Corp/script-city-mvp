import { addEntity, createWorld, EntityId, World } from 'bitecs';
import { Entities } from './entities/entities';

// регистрация сущностей для ECS
const ecsEntities: string[] = Array.from(Object.values(Entities));

// типы сущностей для ECS
type ecsEntitiesNames = keyof typeof ecsEntities;

// менеджер ECS
export class ECSManager {
  private world!: World; // мир для ECS
  private entities: Map<string, EntityId> = new Map(); // сущности для ECS

  constructor() {
    this.createWorld();
    console.group('ECSManager init');
    console.log('Entities registered:', this.entities);
    console.groupEnd();
  }

  private createWorld(): void {
    const world = createWorld();
    this.world = world;
    this.registerEntities();
    console.log('World created:', this.world);
  }

  private registerEntities(): void {
    Object.entries(ecsEntities).forEach(([name]) => {
      const entityId = addEntity(this.world);
      this.entities.set(name, entityId);
    });
  }
}
