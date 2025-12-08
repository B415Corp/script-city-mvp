import { debugError } from '@/infrastructure/utils/logger';
import { CommandProcessor } from '../command_processor/command_processor';
import { ECSManager } from '../ecs_manager/ecs_manager';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';

interface TickPayload {
  tick: number;
  gameTime: number;
}

/**
 * SimulationLoop - класс, который обрабатывает события TickStarted и вызывает CommandProcessor и ECSManager.
 */
export class SimulationLoop {
  /**
   * Конструктор SimulationLoop.
   *
   * @param eventBus - EventBus
   * @param commandProcessor - CommandProcessor
   * @param ecsManager - ECSManager
   */
  constructor(
    private readonly eventBus: EventBus,
    private readonly commandProcessor: CommandProcessor,
    private readonly ecsManager: ECSManager,
  ) {
    this.eventBus.on<TickPayload>(Events.TickStarted, this.tickHandler);
  }

  /**
   * Обработчик события TickStarted.
   * Вызывается при каждом тике.
   *
   * @param payload - payload события
   */
  private readonly tickHandler = (payload: TickPayload = { tick: 0, gameTime: 0 }): void => {
    try {
      // Процессим команды
      this.commandProcessor.processCommands();
      // Запускаем системы
      this.ecsManager.runSystems(1, this.eventBus);
    } catch (error) {
      debugError('Error in SimulationLoop.onTickStarted:', error);
    }
  };

  /**
   * Уничтожает SimulationLoop и отписывается от события TickStarted.
   */
  public destroy(): void {
    // Отписываемся от события TickStarted
    this.eventBus.off(Events.TickStarted, this.tickHandler);
  }
}
