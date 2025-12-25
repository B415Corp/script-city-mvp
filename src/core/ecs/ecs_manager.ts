import { addEntity, createWorld, EntityId, World } from 'bitecs';
import house from './store/entity/house';

// регистрация сущностей для ECS
const ecsEntities = {
  house: house,
} as const;

// типы сущностей для ECS
type ecsEntitiesNames = keyof typeof ecsEntities;

// менеджер ECS
export class ECSManager {
  private world!: World; // мир для ECS
  private entities!: Map<ecsEntitiesNames, EntityId>; // сущности для ECS

  constructor() {
    console.log('ECSManager init');
    this.createWorld();
  }

  private createWorld(): void {
    const world = createWorld();
    this.world = world;
    this.registerEntities();
    console.log('World created:', this.world);
  }

  private registerEntities(): void {
    Object.entries(ecsEntities).forEach(([name, entity]) => {
      const entityId = addEntity(this.world);
      this.entities.set(name as ecsEntitiesNames, entityId);
    });
  }
}
