import { EventBus } from '@/core/event_bus/event_bus';
import { BaseModule } from '../../extends';
import { Logger } from '@/core/utils/logger';
import { ECSManager } from '@/core/ecs/ecs_manager';

export class SimulationModule extends BaseModule {
  protected scene!: Phaser.Scene;
  protected eventBus!: EventBus;
  private logger: Logger;

  constructor(scene: Phaser.Scene, eventBus: EventBus, ecsManager: ECSManager) {
    super(scene, eventBus, ecsManager);
    this.logger = Logger.create('🌆 SimulationModule', '#45b7d1');
    this.logger.info('SimulationModule initialized');
  }

  /**
   * Стартовый посев убран: сущности создаются системой zone_spawn
   * по событию ZonePlaced, а не фиксированным набором в конструкторе.
   */
  public startSimulation(): void {
    this.logger.info('Simulation ready: settlement via ZonePlaced events');
  }
}
