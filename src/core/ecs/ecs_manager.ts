import { addEntity, createWorld, EntityId, World } from 'bitecs';
import { Entities } from './entities/entities';
import { Component } from './components/extended/component';
import { Components } from './components/list';

// регистрация сущностей для ECS
const ecsEntities: string[] = Array.from(Object.values(Entities));
const ecsComponents: Record<string, unknown> = Components;

// типы сущностей для ECS
type ecsEntitiesNames = keyof typeof ecsEntities;
type ecsComponentsNames = keyof typeof ecsComponents;

// менеджер ECS
export class ECSManager {
  private world!: World; // мир для ECS
  private entities: Map<string, EntityId> = new Map(); // сущности для ECS
  private components: Map<string, Component<Record<string, unknown>>> = new Map(); // компоненты для ECS

  constructor() {
    console.group('ECSManager init');
    this.createWorld();
    this.registerEntities();
    this.registerComponents();
    console.log('Entities registered:', this.entities);
    console.log('Components registered:', this.components);
    console.groupEnd();
  }

  private createWorld(): void {
    const world = createWorld();
    this.world = world;

    console.log('World created:', this.world);
  }

  private registerEntities(): void {
    Object.entries(ecsEntities).forEach(([name]) => {
      const entityId = addEntity(this.world);
      this.entities.set(name, entityId);
    });
  }

  private registerComponents(): void {
    Object.entries(ecsComponents).forEach(([name, component]) => {
      const entityId = this.entities.get(name);
      if (!entityId) {
        throw new Error(`Entity ${name} not found`);
      }
      const _component = new Component(this.world, entityId, component as Record<string, unknown>);
      _component.define();
    });
  }
}
