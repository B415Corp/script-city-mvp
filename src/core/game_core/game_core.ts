import { ECSManager } from '../ecs_manager/ecs_manager';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { ModuleManager } from '../module_manager/module_manager';
import { CommandProcessor } from '../command_processor/command_processor';
import { TickManager } from '../tick_manager/tick_manager';
import { CoreConfig } from './types';

export class GameCore {
  private tickManager!: TickManager;
  private ecsManager!: ECSManager;
  private eventBus!: EventBus;
  private moduleManager!: ModuleManager;
  private commandProcessor!: CommandProcessor;
  private config?: CoreConfig;

  constructor() {
    // Конструктор пустой, инициализация происходит в initialize()
  }

  public async initialize(config?: CoreConfig): Promise<void> {
    this.config = config;

    // 1. Создание всех менеджеров (EventBus первым, т.к. другие могут его использовать)
    this.eventBus = new EventBus();
    this.ecsManager = new ECSManager();
    this.moduleManager = new ModuleManager();
    this.commandProcessor = new CommandProcessor(this.eventBus, this.ecsManager);

    this.tickManager = new TickManager({
      tickRate: config?.tickRate ?? 10,
      maxCatchUpTicks: config?.maxCatchUpTicks ?? 5,
      eventBus: this.eventBus,
      commandProcessor: this.commandProcessor,
      ecsManager: this.ecsManager,
    });

    // 2. Регистрация базовых систем (если есть)
    // TODO: регистрация базовых систем

    // 3. Подписка на события команд
    this.subscribeToCommandEvents();

    // 4. Подготовка к работе (но без запуска цикла тиков)
    console.warn('👾 GameCore initialized', this.config);
  }

  public async start(): Promise<void> {
    // 1. Инициализация всех зарегистрированных модулей
    await this.moduleManager.initializeModules(this);

    // 2. Запуск TickManager (начало цикла тиков)
    this.tickManager.start();

    // 3. Публикация события GameStarted
    this.eventBus.emit(Events.GameStarted);
    console.warn('👾 GameCore started');
  }

  public stop(): void {
    // 1. Остановка TickManager (прекращение цикла тиков)
    this.tickManager.stop();

    // 2. Публикация события GameStopped
    this.eventBus.emit(Events.GameStopped);

    // 3. Сохранение состояния (если необходимо)
    // TODO: сохранение состояния
    console.warn('👾 GameCore stopped');
  }

  public destroy(): void {
    // 1. Остановка всех систем
    this.stop();

    // 2. Удаление всех сущностей и компонентов
    this.ecsManager.clear();

    // 3. Очистка всех подписок на события
    this.eventBus.clear();

    // 4. Очистка всех модулей
    this.moduleManager.clear();

    // 5. Освобождение ресурсов
    console.warn('👾 GameCore destroyed');
  }

  public getTickManager(): TickManager {
    return this.tickManager;
  }

  public getECSManager(): ECSManager {
    return this.ecsManager;
  }

  public getEventBus(): EventBus {
    return this.eventBus;
  }

  public getModuleManager(): ModuleManager {
    return this.moduleManager;
  }

  public getCommandProcessor(): CommandProcessor {
    return this.commandProcessor;
  }

  public lockSpeedChange(lockId: string, reason?: string): void {
    this.tickManager.lockSpeedChange(lockId, reason);
    console.warn('👾 GameCore: speed change locked', lockId, reason);
  }

  public unlockSpeedChange(lockId: string): void {
    this.tickManager.unlockSpeedChange(lockId);
    console.warn('👾 GameCore: speed change unlocked', lockId);
  }

  public isSpeedChangeLocked(): boolean {
    return this.tickManager.isSpeedChangeLocked();
  }

  /**
   * Подписка на события команд для обработки запросов на изменение скорости.
   * Изменение скорости обрабатывается немедленно, минуя очередь команд,
   * так как на паузе тики не выполняются и команды из очереди не обрабатываются.
   */
  private subscribeToCommandEvents(): void {
    // Обработка запроса на изменение скорости симуляции (немедленно)
    this.eventBus.on<{ speedLevel: number }>(Events.SetSimulationSpeedRequested, (payload) => {
      if (payload) {
        const success = this.tickManager.setSpeed(payload.speedLevel);
        console.warn('👾 GameCore: speed change request processed', {
          requestedSpeed: payload.speedLevel,
          success,
        });
      }
    });
  }
}
