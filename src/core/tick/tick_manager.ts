import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { TickController } from './controllers/tick_controller';
import { TimeService } from './time_service';
import { LogicTickData, SetSpeedPayload, GameSpeeds } from './types';

/**
 * TickManager - оркестратор управления тиками и временем
 * Использует TickController для fixed timestep логики и новый TimeService для игрового времени
 */
export class TickManager {
  private tickController: TickController;
  private timeService: TimeService;
  private pauseHandler: () => void;
  private speedHandler: (payload: unknown) => void;

  constructor(
    private readonly eventBus: EventBus,
    initialTickRate: GameSpeeds = GameSpeeds.NORMAL,
  ) {
    this.tickController = new TickController(initialTickRate);
    this.timeService = new TimeService(eventBus, initialTickRate);

    // Создаем именованные handlers для корректной отписки
    this.pauseHandler = (): void => this.tickController.togglePause();
    this.speedHandler = (payload: unknown): void => {
      const { speed } = payload as SetSpeedPayload;
      this.tickController.setSpeed(speed);
    };

    // Подписываемся на события управления
    this.eventBus.on(Events.GamePauseToggle, this.pauseHandler);
    this.eventBus.on(Events.SetGameSpeed, this.speedHandler);
  }

  /**
   * Очистка ресурсов - отписка от всех событий
   */
  public destroy(): void {
    // Отписываемся от всех событий EventBus используя именованные handlers
    if (this.eventBus) {
      this.eventBus.off(Events.GamePauseToggle, this.pauseHandler);
      this.eventBus.off(Events.SetGameSpeed, this.speedHandler);
    }
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
      // TimeService теперь эмитит события напрямую (time:tick, time:day, time:week)
      this.timeService.tick();

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

  public getTimeService(): TimeService {
    return this.timeService;
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
