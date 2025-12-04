import { ECSManager } from '../ecs_manager/ecs_manager';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { ModuleManager } from '../module_manager/module_manager';
import { CommandProcessor } from '../command_processor/command_processor';
import { TickManager } from '../tick_manager/tick_manager';
import { ToolManager } from '@/modules/tools/tool_manager';
import { CoreConfig } from './types';
import { SaveManager } from '../save_manager/save_manager';

export class GameCore {
  private tickManager!: TickManager;
  private ecsManager!: ECSManager;
  private eventBus!: EventBus;
  private moduleManager!: ModuleManager;
  private commandProcessor!: CommandProcessor;
  private saveManager!: SaveManager;
  private toolManager?: ToolManager;
  private config?: CoreConfig;

  constructor() {
    // Конструктор пустой, инициализация происходит в initialize()
  }

  public async initialize(config?: CoreConfig): Promise<void> {
    console.group('GameCore initialize');
    this.config = config;

    // 1. Создание всех менеджеров (EventBus первым, т.к. другие могут его использовать)
    this.eventBus = new EventBus();
    this.ecsManager = new ECSManager();
    this.moduleManager = new ModuleManager();
    this.commandProcessor = new CommandProcessor(this.eventBus, this.ecsManager);
    this.saveManager = new SaveManager();

    this.tickManager = new TickManager({
      tickRate: config?.tickRate ?? 10,
      maxCatchUpTicks: config?.maxCatchUpTicks ?? 5,
      eventBus: this.eventBus,
      commandProcessor: this.commandProcessor,
      ecsManager: this.ecsManager,
    });

    // Инициализация SaveManager
    this.saveManager.initialize(this, this.eventBus);

    // 2. Регистрация базовых систем (если есть)
    // TODO: регистрация базовых систем

    // 3. Подписка на события команд
    this.subscribeToCommandEvents();

    // 4. Подготовка к работе (но без запуска цикла тиков)
    console.warn('👾 GameCore initialized', this.config);
    console.groupEnd();
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

    // 5. Закрытие SaveManager
    this.saveManager.destroy();

    // 6. Освобождение ресурсов
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

  public getSaveManager(): SaveManager {
    return this.saveManager;
  }

  public setSaveManager(saveManager: SaveManager): void {
    this.saveManager = saveManager;
  }

  public getConfig(): CoreConfig {
    if (!this.config) {
      throw new Error('Config is not initialized');
    }
    return this.config;
  }

  /**
   * Получение ToolManager.
   * ToolManager создается модулем ToolsModule и должен быть зарегистрирован перед использованием.
   *
   * @returns экземпляр ToolManager
   * @throws {Error} если ToolManager еще не инициализирован модулем ToolsModule
   */
  public getToolManager(): ToolManager {
    if (!this.toolManager) {
      throw new Error(
        'ToolManager is not initialized. Make sure ToolsModule is registered and initialized before using tools.',
      );
    }
    return this.toolManager;
  }

  /**
   * Установка ToolManager.
   * Вызывается модулем ToolsModule при инициализации.
   * Этот метод не предназначен для использования вне модулей.
   *
   * @param toolManager - экземпляр ToolManager
   */
  public setToolManager(toolManager: ToolManager): void {
    this.toolManager = toolManager;
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
