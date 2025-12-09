import { ECSManager } from '../ecs_manager/ecs_manager';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { ModuleManager } from '../module_manager/module_manager';
import { CommandProcessor } from '../command_processor/command_processor';
import { TickManager } from '../tick_manager/tick_manager';
import { ToolManager } from '@/modules/tools/tool_manager';
import { CoreConfig } from './types';
import { SaveManager } from '../save_manager/save_manager';
import { debugGroup, debugGroupEnd, debugLog } from '@/infrastructure/utils/logger';
import { MapManager } from '../map_manager/map_manager';
import { SceneController } from '@/app/scene_controller/scene_controller';
import { SimulationLoop } from '../simulation_loop/simulation_loop';
import { CommandRegistry } from '../command_processor/command_registry';

export class GameCore {
  private tickManager!: TickManager;
  private ecsManager!: ECSManager;
  private eventBus!: EventBus;
  private moduleManager!: ModuleManager;
  private commandProcessor!: CommandProcessor;
  private saveManager!: SaveManager;
  private toolManager?: ToolManager;
  private mapManager!: MapManager;
  private config?: CoreConfig;
  private sceneController?: SceneController;
  private simulationLoop!: SimulationLoop;
  constructor() {
    // Конструктор пустой, инициализация происходит в initialize()
  }

  public async initialize(config?: CoreConfig): Promise<void> {
    debugGroup('👾 GameCore: инициализация');
    this.config = config;
    debugLog('Конфигурация получена', { config: this.config });

    // 1. Создание всех менеджеров (EventBus первым, т.к. другие могут его использовать)
    debugGroup('Создание менеджеров');
    this.eventBus = new EventBus();
    const commandRegistry = new CommandRegistry();
    this.mapManager = new MapManager(this);
    this.mapManager.initialize();
    this.ecsManager = new ECSManager();
    this.moduleManager = new ModuleManager(commandRegistry);
    this.commandProcessor = new CommandProcessor(this.eventBus, this.ecsManager, commandRegistry);
    this.saveManager = new SaveManager();
    this.simulationLoop = new SimulationLoop(this.eventBus, this.commandProcessor, this.ecsManager);
    this.tickManager = new TickManager({
      tickRate: config?.tickRate ?? 10,
      maxCatchUpTicks: config?.maxCatchUpTicks ?? 5,
      eventBus: this.eventBus,
    });
    debugGroupEnd();

    // Регистрация базовых хэндлеров команд
    await this.registerBaseCommandHandlers(commandRegistry);

    // Инициализация SaveManager
    await this.saveManager.initialize(this, this.eventBus);

    // 2. Регистрация базовых систем (если есть)
    debugGroup('ECSManager: Регистрация базовых систем');
    // TODO: регистрация базовых систем
    debugLog('ECSManager: Регистрация базовых систем', { ecsManager: this.ecsManager });
    // так как в MVP нет систем, то регистрация базовых систем не нужна
    debugLog('ECSManager: Регистрация базовых систем не нужна на MVP');
    // this.ecsManager.registerSystem(new PopulationSystem());
    debugGroupEnd();

    // 3. Подписка на события команд
    this.subscribeToCommandEvents();

    // 4. Подготовка к работе (но без запуска цикла тиков)
    debugLog('👾 GameCore инициализирован', { config: this.config });
    debugGroupEnd();
  }

  /**
   * Регистрация базовых хэндлеров команд.
   * Эти хэндлеры предоставляют основную функциональность команд.
   */
  private async registerBaseCommandHandlers(registry: CommandRegistry): Promise<void> {
    const {
      BuildBuildingCommandHandler,
      BulldozeAreaCommandHandler,
      ChangeTaxRateCommandHandler,
      SetPolicyCommandHandler,
      SetSimulationSpeedCommandHandler,
      ZoneTileCommandHandler,
      RemoveZoneCommandHandler,
    } = await import('../command_processor/handlers');

    registry.registerHandler(new BuildBuildingCommandHandler(this.eventBus));
    registry.registerHandler(new BulldozeAreaCommandHandler(this.eventBus));
    registry.registerHandler(new ChangeTaxRateCommandHandler(this.eventBus));
    registry.registerHandler(new SetPolicyCommandHandler(this.eventBus));
    registry.registerHandler(new SetSimulationSpeedCommandHandler(this.eventBus));
    registry.registerHandler(new ZoneTileCommandHandler(this.eventBus));
    registry.registerHandler(new RemoveZoneCommandHandler(this.eventBus));

    debugLog('Базовые хэндлеры команд зарегистрированы', {
      count: registry.getRegisteredTypes().length,
    });
  }

  public async start(): Promise<void> {
    debugGroup('👾 GameCore: запуск');
    // 1. Инициализация всех зарегистрированных модулей
    await this.moduleManager.initializeModules(this);

    // 2. Запуск TickManager (начало цикла тиков)
    this.tickManager.start();

    // 3. Публикация события GameStarted
    debugLog('Публикация события GameStarted');
    this.eventBus.emit(Events.GameStarted);
    debugLog('👾 GameCore запущен');
    debugGroupEnd();
  }

  public stop(): void {
    debugGroup('👾 GameCore: остановка');
    // 1. Остановка TickManager (прекращение цикла тиков)
    debugGroup('Остановка TickManager');
    this.tickManager.stop();
    debugLog('TickManager остановлен');
    debugGroupEnd();

    // 2. Публикация события GameStopped
    debugLog('Публикация события GameStopped');
    this.eventBus.emit(Events.GameStopped);

    // 3. Сохранение состояния (если необходимо)
    // TODO: сохранение состояния
    debugLog('👾 GameCore остановлен');
    debugGroupEnd();
  }

  public destroy(): void {
    debugGroup('👾 GameCore: уничтожение');
    // 1. Остановка всех систем
    this.stop();

    // 2. Удаление всех сущностей и компонентов
    debugGroup('Очистка ECS');
    this.ecsManager.clear();
    debugGroupEnd();

    // 3. Очистка всех подписок на события
    debugGroup('Очистка EventBus');
    this.eventBus.clear();
    debugGroupEnd();

    // 4. Очистка всех модулей
    debugGroup('Очистка модулей');
    this.moduleManager.clear();
    debugGroupEnd();

    // 5. Закрытие SaveManager
    debugGroup('Закрытие SaveManager');
    this.saveManager.destroy();
    debugGroupEnd();

    // 6. Освобождение ресурсов
    debugLog('👾 GameCore уничтожен');
    debugGroupEnd();
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

  public setSceneController(sceneController: SceneController): void {
    this.sceneController = sceneController;
  }

  public getSceneController(): SceneController | undefined {
    return this.sceneController;
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

  public getMapManager(): MapManager {
    return this.mapManager;
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
    debugGroup('EventBus: Подписка на события команд');
    // Обработка запроса на изменение скорости симуляции (немедленно)
    this.eventBus.on<{ speedLevel: number }>(Events.SetSimulationSpeedRequested, (payload) => {
      if (payload) {
        debugLog('EventBus: Получен запрос на изменение скорости', {
          eventType: Events.SetSimulationSpeedRequested,
          speedLevel: payload.speedLevel,
        });
        const success = this.tickManager.setSpeed(payload.speedLevel);
        debugLog('EventBus: Изменение скорости обработано', {
          requestedSpeed: payload.speedLevel,
          success,
        });
      }
    });
    debugLog('EventBus: Подписка на SetSimulationSpeedRequested установлена', {
      eventType: Events.SetSimulationSpeedRequested,
    });
    debugGroupEnd();
  }
}
