import { ECSManager } from '../ecs/ecs_manager';
import { EventBus } from '../event_bus/event_bus';
import { TickManager } from '../tick/tick_manager';
import { Logger } from '../utils/logger';

export class EntrySimulation {
  private logger: Logger;

  constructor(
    private ecsManager: ECSManager,
    private eventBus: EventBus,
    private tickManager: TickManager,
  ) {
    this.logger = Logger.create('EntrySimulation');
    this.logger.info('EntrySimulation initialized');
  }

  public start(): void {
    this.logger.info('EntrySimulation started');

    // Здесь будет логика запуска симуляции
    // Пока что просто логгируем
    this.logger.info('Simulation systems are ready');
  }

  public stop(): void {
    this.logger.info('EntrySimulation stopped');
  }
}
