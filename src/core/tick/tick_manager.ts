import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { TickController } from './controllers/tick_controller';
import { TimeController } from './controllers/time_controller';
import { TimeService } from './time_service';
import { LogicTickData, SetSpeedPayload } from './types';

/**
 * TickManager - оркестратор управления тиками и временем
 * Использует TickController для fixed timestep логики и TimeController для игрового времени
 */
export class TickManager {
  private tickController: TickController;
  private timeController: TimeController;
  private timeService: TimeService;
  private eventBusTimeService: TimeService;

  constructor(
    private readonly eventBus: EventBus,
    initialTickRate = 10,
  ) {
    this.tickController = new TickController(initialTickRate);
    this.timeController = new TimeController(eventBus);
    this.timeService = TimeService.fromTimeController(this.timeController);
    this.eventBusTimeService = TimeService.createFromEventBus(eventBus);

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

      // Эмитим LogicTick только с данными тика
      this.eventBus.emit(Events.LogicTick, this.createLogicTickData(ticksToExecute));
    }
  }

  /**
   * Создает данные для LogicTick события
   */
  private createLogicTickData(ticksExecuted: number): LogicTickData {
    return {
      delta: this.tickController.getFixedStepMs(),
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

  // Доступ к контроллерам и сервисам
  public getTickController(): TickController {
    return this.tickController;
  }

  public getTimeController(): TimeController {
    return this.timeController;
  }

  public getTimeService(): TimeService {
    return this.timeService;
  }

  /**
   * Получить TimeService, который работает с eventBus
   * Используйте этот метод для компонентов, которые хотят получать время через события
   */
  public getEventBusTimeService(): TimeService {
    return this.eventBusTimeService;
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
