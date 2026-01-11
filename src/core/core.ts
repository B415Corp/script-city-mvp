import Phaser from 'phaser';
import ModuleManager from './modules/module_manager';
import { MainScene } from './scenes';
import { EventBus } from './event_bus/event_bus';
import { ECSManager } from './ecs/ecs_manager';
import { TickManager } from './tick/tick_manager';
import { ComponentRegistry } from './ecs/registry/component_registry';
import { SystemRegistry } from './ecs/registry/system_registry';
import { ClusterRegistry } from './ecs/registry/cluster_registry';
import { EntityFactoryRegistry } from './ecs/registry/entity_factory_registry';
import { GameSpeeds } from './tick/types';
import { ICoreDependencies } from './types';
import { CoreLifecycle } from './internal/core_lifecycle';
import { CoreInitialization } from './internal/core_initialization';

export class Core {
  private phaserConfig: Phaser.Types.Core.GameConfig;
  private enableSimulation: boolean = false; // Для тестирования можно переопределить
  private destroyed: boolean = false; // Для тестирования

  // Композиция для разделения ответственности
  private lifecycle: CoreLifecycle;
  private initialization: CoreInitialization;

  // Публичные поля для обратной совместимости
  public moduleManager?: ModuleManager;
  public ecsManager: ECSManager | null = null;
  public eventBus?: EventBus;
  public tickManager?: TickManager;

  // Фабрики зависимостей с дефолтными значениями
  private phaserFactory: () => Phaser.Game;
  private eventBusFactory: () => EventBus;
  private tickManagerFactory: (eventBus: EventBus, initialSpeed?: GameSpeeds) => TickManager;
  private ecsManagerFactory: (eventBus: EventBus, tickManager: TickManager) => ECSManager;
  private moduleManagerFactory: (
    scene: MainScene,
    eventBus: EventBus,
    ecsManager: ECSManager | null,
    tickManager: TickManager,
  ) => ModuleManager;

  constructor(phaserConfig: Phaser.Types.Core.GameConfig, dependencies: ICoreDependencies = {}) {
    this.phaserConfig = phaserConfig;

    // Настраиваем фабрики с дефолтными значениями
    this.phaserFactory = dependencies.phaserFactory || (() => new Phaser.Game(this.phaserConfig));
    this.eventBusFactory = dependencies.eventBusFactory || (() => new EventBus());
    this.tickManagerFactory =
      dependencies.tickManagerFactory ||
      ((eventBus: EventBus, initialSpeed: GameSpeeds = GameSpeeds.NORMAL): TickManager =>
        new TickManager(eventBus, initialSpeed));
    this.ecsManagerFactory =
      dependencies.ecsManagerFactory ||
      ((eventBus: EventBus, tickManager: TickManager): ECSManager =>
        new ECSManager(eventBus, tickManager));
    this.moduleManagerFactory =
      dependencies.moduleManagerFactory ||
      ((
        scene: Phaser.Scene,
        eventBus: EventBus,
        ecsManager: ECSManager | null,
        tickManager: TickManager,
      ): ModuleManager => new ModuleManager(scene, eventBus, ecsManager, tickManager));

    // Инициализируем компоненты
    this.lifecycle = new CoreLifecycle(
      undefined,
      undefined,
      this.moduleManager,
      this.ecsManager,
      this.eventBus,
      this.tickManager,
    );

    this.initialization = new CoreInitialization(
      undefined,
      undefined,
      undefined,
      null,
      undefined,
      this.phaserFactory,
      this.eventBusFactory,
      this.tickManagerFactory,
      this.ecsManagerFactory,
      this.moduleManagerFactory,
    );

    this.lifecycle.setupResizeHandler();
  }

  // Делегируем методы жизненного цикла
  public destroy(): void {
    this.destroyed = true;
    this.lifecycle.destroy();

    // Очищаем публичные поля для обратной совместимости
    this.moduleManager = undefined;
    this.ecsManager = null;
    this.eventBus = undefined;
    this.tickManager = undefined;

    // Обновляем состояния в компонентах
    this.lifecycle.setPhaser(undefined);
    this.lifecycle.setModuleManager(undefined);
    this.lifecycle.setECSManager(null);
    this.lifecycle.setEventBus(undefined);
    this.lifecycle.setTickManager(undefined);

    // Пересоздаем initialization с очищенными состояниями
    this.initialization = new CoreInitialization(
      undefined,
      undefined,
      undefined,
      null,
      undefined,
      this.initialization['phaserFactory'],
      this.initialization['eventBusFactory'],
      this.initialization['tickManagerFactory'],
      this.initialization['ecsManagerFactory'],
      this.initialization['moduleManagerFactory'],
    );
  }

  // Делегируем методы инициализации
  public async init(): Promise<void> {
    await this.initialization.init();

    // Синхронизируем публичные поля
    this.moduleManager = this.initialization.getModuleManager();
    this.ecsManager = this.initialization.getECSManager();
    this.eventBus = this.initialization.getEventBus();
    this.tickManager = this.initialization.getTickManager();

    // Обновляем ссылки в lifecycle
    this.lifecycle.setPhaser(this.initialization.getPhaser());
    this.lifecycle.setModuleManager(this.moduleManager);
    this.lifecycle.setECSManager(this.ecsManager);
    this.lifecycle.setEventBus(this.eventBus);
    this.lifecycle.setTickManager(this.tickManager);
  }

  public async initializePhaser(): Promise<void> {
    await this.initialization.initializePhaser();
    const phaser = this.initialization.getPhaser();
    this.lifecycle.setPhaser(phaser);
  }

  public async initializeEventBus(): Promise<void> {
    await this.initialization.initializeEventBus();
    this.eventBus = this.initialization.getEventBus();
    this.lifecycle.setEventBus(this.eventBus);
  }

  public initializeTickManager(): void {
    this.initialization.initializeTickManager();
    this.tickManager = this.initialization.getTickManager();
    this.lifecycle.setTickManager(this.tickManager);
  }

  public async initializeECSManager(): Promise<void> {
    await this.initialization.initializeECSManager();
    this.ecsManager = this.initialization.getECSManager();
    this.lifecycle.setECSManager(this.ecsManager);
  }

  public async initializeModules(): Promise<void> {
    await this.initialization.initializeModules();
    this.moduleManager = this.initialization.getModuleManager();
    this.lifecycle.setModuleManager(this.moduleManager);
  }

  /**
   * Высокоуровневый API для доступа к реестрам ECS (Phase 4)
   * Предоставляет доступ к компонентам, системам, кластерам и фабрикам для отладки
   */
  get ecsRegistries(): {
    components: () => ComponentRegistry;
    systems: () => SystemRegistry;
    clusters: () => ClusterRegistry;
    entityFactories: () => EntityFactoryRegistry;
  } | null {
    if (!this._ecsManager) {
      return null;
    }
    return {
      components: (): ComponentRegistry => ComponentRegistry.getInstance(),
      systems: (): SystemRegistry => SystemRegistry.getInstance(),
      clusters: (): ClusterRegistry => ClusterRegistry.getInstance(),
      entityFactories: (): EntityFactoryRegistry => EntityFactoryRegistry.getInstance(),
    };
  }

  // Геттеры для тестирования (доступ к внутренним полям)
  /** @internal Для тестирования */
  get _phaser(): Phaser.Game | undefined {
    return this.initialization.getPhaser();
  }

  /** @internal Для тестирования */
  get _eventBus(): EventBus | undefined {
    return this.eventBus;
  }

  /** @internal Для тестирования */
  get _tickManager(): TickManager | undefined {
    return this.tickManager;
  }

  /** @internal Для тестирования */
  get _ecsManager(): ECSManager | null {
    return this.ecsManager;
  }

  /** @internal Для тестирования */
  get _moduleManager(): ModuleManager | undefined {
    return this.initialization.getModuleManager();
  }

  /** @internal Для тестирования */
  get _phaserConfig(): Phaser.Types.Core.GameConfig {
    return this.phaserConfig;
  }

  /** @internal Для тестирования */
  get _enableSimulation(): boolean {
    return this.enableSimulation;
  }

  /** @internal Для тестирования */
  set _enableSimulation(value: boolean) {
    this.enableSimulation = value;
    // Обновляем enableSimulation в initialization
    this.initialization = new CoreInitialization(
      this.initialization.getPhaser(),
      this.initialization.getEventBus(),
      this.initialization.getTickManager(),
      this.initialization.getECSManager(),
      this.initialization.getModuleManager(),
      this.initialization['phaserFactory'],
      this.initialization['eventBusFactory'],
      this.initialization['tickManagerFactory'],
      this.initialization['ecsManagerFactory'],
      this.initialization['moduleManagerFactory'],
    );
  }

  /** @internal Для тестирования */
  get _resizeHandler(): (() => void) | undefined {
    // Если объект уничтожен, возвращаем undefined
    if (this.destroyed) {
      return undefined;
    }

    // Возвращаем функцию resize handler (создаем ее динамически для тестирования)
    return (): void => {
      const phaser = this.initialization.getPhaser();
      if (phaser) {
        phaser.scale.resize(window.innerWidth, window.innerHeight);
      }
    };
  }

  // Сеттеры для тестирования
  /** @internal Для тестирования */
  set _phaser(value: Phaser.Game | undefined) {
    this.lifecycle.setPhaser(value);
    this.initialization = new CoreInitialization(
      value,
      this.initialization.getEventBus(),
      this.initialization.getTickManager(),
      this.initialization.getECSManager(),
      this.initialization.getModuleManager(),
      this.initialization['phaserFactory'],
      this.initialization['eventBusFactory'],
      this.initialization['tickManagerFactory'],
      this.initialization['ecsManagerFactory'],
      this.initialization['moduleManagerFactory'],
    );
  }

  /** @internal Для тестирования */
  set _eventBus(value: EventBus | undefined) {
    this.eventBus = value;
    this.lifecycle.setEventBus(value);
    // Обновляем eventBus в initialization
    this.initialization = new CoreInitialization(
      this.initialization.getPhaser(),
      value,
      this.initialization.getTickManager(),
      this.initialization.getECSManager(),
      this.initialization.getModuleManager(),
      this.initialization['phaserFactory'],
      this.initialization['eventBusFactory'],
      this.initialization['tickManagerFactory'],
      this.initialization['ecsManagerFactory'],
      this.initialization['moduleManagerFactory'],
    );
  }

  /** @internal Для тестирования */
  set _tickManager(value: TickManager | undefined) {
    this.tickManager = value;
    this.lifecycle.setTickManager(value);
    // Обновляем tickManager в initialization
    this.initialization = new CoreInitialization(
      this.initialization.getPhaser(),
      this.initialization.getEventBus(),
      value,
      this.initialization.getECSManager(),
      this.initialization.getModuleManager(),
      this.initialization['phaserFactory'],
      this.initialization['eventBusFactory'],
      this.initialization['tickManagerFactory'],
      this.initialization['ecsManagerFactory'],
      this.initialization['moduleManagerFactory'],
    );
  }

  /** @internal Для тестирования */
  set _ecsManager(value: ECSManager | null) {
    this.ecsManager = value;
    this.lifecycle.setECSManager(value);
  }

  /** @internal Для тестирования */
  set _moduleManager(value: ModuleManager | undefined) {
    this.moduleManager = value;
    this.lifecycle.setModuleManager(value);
    // Обновляем moduleManager в initialization
    this.initialization = new CoreInitialization(
      this.initialization.getPhaser(),
      this.initialization.getEventBus(),
      this.initialization.getTickManager(),
      this.initialization.getECSManager(),
      value,
      this.initialization['phaserFactory'],
      this.initialization['eventBusFactory'],
      this.initialization['tickManagerFactory'],
      this.initialization['ecsManagerFactory'],
      this.initialization['moduleManagerFactory'],
    );
  }
}

// Экспортируем CoreBuilder для обратной совместимости
export { CoreBuilder } from './internal/core_builder';
