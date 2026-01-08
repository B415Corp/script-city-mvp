import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { TickController } from './controllers/tick_controller';
import { TimeController } from './controllers/time_controller';
import { LogicTickData, SetSpeedPayload } from './types';

/**
 * TickManager - оркестратор управления тиками и временем
 * Использует TickController для fixed timestep логики и TimeController для игрового времени
 */
export class TickManager {
  private tickController: TickController;
  private timeController: TimeController;

  constructor(
    private readonly eventBus: EventBus,
    initialTickRate = 10,
  ) {
    this.tickController = new TickController(initialTickRate);
    this.timeController = new TimeController(eventBus);

    // Подписываемся на события управления
    this.eventBus.on(Events.GamePauseToggle, () => this.tickController.togglePause());
    this.eventBus.on(Events.SetGameSpeed, (payload) => {
      const { speed } = payload as SetSpeedPayload;
      this.tickController.setSpeed(speed);
    });
  }

  /**
   * Основное обновление - обрабатывает тики и время
   */
  update(time: number, delta: number): void {
    // "TickStarted" можно оставить как кадр-событие (каждый rAF)
    this.eventBus.emit(Events.TickStarted, { time, delta });

    // Получаем количество тиков для выполнения
    const ticksToExecute = this.tickController.update(delta);

    // Выполняем тики
    for (let i = 0; i < ticksToExecute; i++) {
      // Обновляем игровое время
      this.timeController.tick();

      // Эмитим обновление времени
      this.timeController.emitTimeUpdate();

      // Эмитим LogicTick с данными от обоих контроллеров
      this.eventBus.emit(Events.LogicTick, this.createLogicTickData(time, ticksToExecute));
    }
  }

  /**
   * Создает данные для LogicTick события
   */
  private createLogicTickData(time: number, ticksExecuted: number): LogicTickData {
    return {
      delta: this.tickController.getFixedStepMs(),
      gameTime: this.timeController.getGameTime(),
      gameTimeOfDay: this.timeController.getGameTimeOfDay(),
      day: this.timeController.getDay(),
      ticksExecuted,
    };
  }

  // Делегируем методы контроллерам

  // Управление паузой
  public pause(): void {
    this.tickController.pause();
  }

  public resume(): void {
    this.tickController.resume();
  }

  public togglePause(): void {
    this.tickController.togglePause();
  }

  // Доступ к контроллерам
  public getTickController(): TickController {
    return this.tickController;
  }

  public getTimeController(): TimeController {
    return this.timeController;
  }

  // Геттеры для обратной совместимости
  public getFixedStepMs(): number {
    return this.tickController.getFixedStepMs();
  }

  public getTickRate(): number {
    return this.tickController.getTickRate();
  }

  public isPaused(): boolean {
    return this.tickController.isPaused();
  }
}
