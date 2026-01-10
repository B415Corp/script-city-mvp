import { createWorld, World } from 'bitecs';
import { EventBus } from '../event_bus/event_bus';
import { TickManager } from '../tick/tick_manager';
import { Logger } from '../utils/logger';

// Временно закомментированы импорты удаленных модулей для Phase 0
// import { EntityFactory } from './entities';
// import { createDayNightCycleSystem } from './systems/clusters/day_night_cycle_system';
// import {
//   createWorkSystem,
//   createMovementSystem,
//   createHappinessSystem,
// } from './systems/clusters/schedule_activity_systems';
// import { SystemCluster } from './systems/types';
// import { LogicTickData } from '../tick/types';
// import { Person, Citizen, Needs } from './components/population';
// import { Residential, Workplace, Commercial } from './components/buildings';
// import { Position } from './components/shared/position_component';
// import { ID } from './components/shared/id_component';
// import { Render } from './components/shared/render_component';
// import { Schedule } from './components/shared/schedule_component';

export class ECSManager {
  private world: World;
  private logger: Logger;

  constructor(
    private eventBus: EventBus,
    private tickManager: TickManager,
  ) {
    this.logger = Logger.create('ECSManager');
    this.logger.info('ECSManager initialized (Phase 0 - minimal mode)');
    this.world = createWorld();
    // В Phase 0 ECSManager создает только пустой world
  }

  /**
   * Возвращает BitECS world (для Phase 0 - пустой)
   */
  getWorld(): World {
    return this.world;
  }

  /**
   * Возвращает статистику ECS (для Phase 0 - пустая)
   */
  getStats(): any {
    return {
      totalSystemsCount: 0,
      clustersCount: 0,
      systems: [],
      clusters: {},
      entityCount: 0,
      entityCountsByType: {},
      gameTime: 0,
      timeData: null,
      totalEntities: 0,
    };
  }

  // В Phase 0 остальные методы не нужны - ECS отключен
}