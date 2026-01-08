import { createWorld, addEntity, removeEntity, World, EntityId } from 'bitecs';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';

import { EntityFactory } from './entities';
import { PopulationSystem, NeedsSystem, DailyRoutineSystem } from './systems/clusters';
import { System } from './systems/types';
import { GameTimeUpdateData } from './types';
import { LogicTickData } from '../tick/types';

export type systemsClusters = Record<number, System[]>;

export class ECSManager {
  private world: World;
  private entityFactory: EntityFactory; // Фабрика сущностей для создания новых сущностей
  private systems: System[] = []; // Системы для обновления сущностей
  private systemsClusters: systemsClusters = {
    1: [PopulationSystem, NeedsSystem, DailyRoutineSystem],
  };

  constructor(private eventBus: EventBus) {
    console.log('🚀 ECSManager initialized');
    this.world = createWorld();
    this.entityFactory = new EntityFactory(this.world);

    // Подписываемся на LogicTick для обновления систем
    this.eventBus.on(Events.LogicTick, (payload) => {
      const tickData = payload as LogicTickData;
      this.updateSystems(tickData);
    });
  }

  /**
   * Регистрирует систему для автоматического обновления
   */
  registerSystem(system: System): void {
    this.systems.push(system);
    console.log(`📋 Registered system: ${system.name}`);
  }

  /**
   * Обновляет все зарегистрированные системы
   * Вызывается на каждый LogicTick
   */
  private updateSystems(tickData: LogicTickData): void {
    for (const system of this.systems) {
      // Получаем сущности для этой системы
      const entities = this.queryEntities(system.components);
      system.update(this.world, entities, tickData.delta, tickData.gameTimeOfDay);
    }
  }

  /**
   * Запрашивает сущности по компонентам
   * TODO: Реализовать настоящий query по компонентам
   */
  private queryEntities(componentNames: readonly string[]): EntityId[] {
    // Пока что возвращаем все сущности (нужно реализовать настоящий query)
    // В будущем использовать bitecs query() с нужными компонентами
    return []; // TODO: Реализовать
  }

  /**
   * Получить фабрику сущностей
   */
  get entities(): EntityFactory {
    return this.entityFactory;
  }

  /**
   * Получить мир
   */
  getWorld(): World {
    return this.world;
  }

  /**
   * Создать сущность
   */
  createEntity(): EntityId {
    return addEntity(this.world);
  }

  /**
   * Уничтожить сущность
   */
  destroyEntity(eid: EntityId): void {
    removeEntity(this.world, eid);
  }

  /**
   * Получить статистику симуляции
   */
  getStats(): {
    systemsCount: number;
    systems: string[];
  } {
    return {
      systemsCount: this.systems.length,
      systems: this.systems.map((s) => s.name),
    };
  }
}
