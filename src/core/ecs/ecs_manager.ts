import {
  createWorld,
  addEntity,
  removeEntity,
  addComponent,
  removeComponent,
  hasComponent,
  World,
  EntityId,
} from 'bitecs';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';

type ComponentStore = object;

export class ECSManager<C extends Record<string, ComponentStore>> {
  private world: World;
  private components: C;
  private eventBus: EventBus;

  constructor(eventBus: EventBus, components: C, context?: object) {
    console.log('ECSManager init');
    this.components = components; // компоненты для ECS
    this.world = context ? createWorld(context) : createWorld(); // создать мир
    this.eventBus = eventBus;

    // подписка на событие логического тика
    this.eventBus.on(Events.LogicTick, () => {
      console.log('LogicTick');
    });
  }

  // получить мир
  public getWorld(): World {
    return this.world;
  }

  // создать сущность
  public createEntity(): EntityId {
    return addEntity(this.world);
  }

  // уничтожить сущность
  public destroyEntity(eid: EntityId): void {
    removeEntity(this.world, eid);
  }

  // добавить компонент
  public add<K extends keyof C>(name: K, eid: EntityId): void {
    addComponent(this.world, eid, this.components[name]); // <-- 0.4 порядок аргументов [page:1]
  }

  // удалить компонент
  public remove<K extends keyof C>(name: K, eid: EntityId): void {
    removeComponent(this.world, eid, this.components[name]); // <-- 0.4 порядок аргументов [page:1]
  }

  // проверить наличие компонента
  public has<K extends keyof C>(name: K, eid: EntityId): boolean {
    return hasComponent(this.world, eid, this.components[name]); // <-- 0.4 порядок аргументов [page:1]
  }

  // создать сущность с набором компонентов
  public spawn(names: readonly (keyof C)[], init?: (eid: EntityId) => void): EntityId {
    const eid = addEntity(this.world);
    for (const n of names) addComponent(this.world, eid, this.components[n]);
    return eid;
  }
}
