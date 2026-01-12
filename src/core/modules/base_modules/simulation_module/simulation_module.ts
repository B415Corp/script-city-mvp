import { EventBus } from '@/core/event_bus/event_bus';
import { BaseModule } from '../../extends';
import { Logger } from '@/core/utils/logger';
import { ECSManager } from '@/core/ecs/ecs_manager';
import { createCitizen, createFactory } from '@/core/ecs/entities/test/firts_sim_factory';

export class SimulationModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;
  private logger: Logger;

  constructor(scene: Phaser.Scene, eventBus: EventBus, ecsManager: ECSManager) {
    super(scene, eventBus, ecsManager);
    this.logger = Logger.create('🌆 SimulationModule', '#45b7d1');
    this.logger.info('SimulationModule initialized');

    this.startSimulation();
  }
  public startSimulation(): void {
    this.logger.info('🌠🌠🌠 Simulation started');

    this.createCitizens();
    this.createFactories();

    this.logger.info('👥 Жителей создано: 10');
    this.logger.info('🏭 Заводов создано: 5');
  }

  private createCitizens(): void {
    const world = this.ecsManager.getWorld();

    for (let i = 0; i < 10; i++) {
      createCitizen(world);
    }
  }

  private createFactories(): void {
    const world = this.ecsManager.getWorld();

    for (let i = 0; i < 5; i++) {
      createFactory(world);
    }
  }
}
