import Phaser from 'phaser';
import ModuleManager from '../modules/module_manager';
import { EventBus } from '../event_bus/event_bus';
import { ECSManager } from '../ecs/ecs_manager';
import { TickManager } from '../tick/tick_manager';

// Методы жизненного цикла для Core
export class CoreLifecycle {
  private phaser?: Phaser.Game;
  private resizeHandler?: () => void;
  private moduleManager?: ModuleManager;
  private ecsManager: ECSManager | null = null;
  private eventBus?: EventBus;
  private tickManager?: TickManager;

  constructor(
    phaser: Phaser.Game | undefined,
    resizeHandler: (() => void) | undefined,
    moduleManager: ModuleManager | undefined,
    ecsManager: ECSManager | null,
    eventBus: EventBus | undefined,
    tickManager: TickManager | undefined,
  ) {
    this.phaser = phaser;
    this.resizeHandler = resizeHandler;
    this.moduleManager = moduleManager;
    this.ecsManager = ecsManager;
    this.eventBus = eventBus;
    this.tickManager = tickManager;
  }

  setupResizeHandler(): void {
    this.resizeHandler = (): void => {
      if (this.phaser) {
        this.phaser.scale.resize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  destroy(): void {
    // Удаляем resize listener
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = undefined;
    }

    // Очищаем moduleManager с error handling
    if (this.moduleManager) {
      try {
        this.moduleManager.destroy();
      } catch (error) {
        console.error('[Core] Error destroying ModuleManager:', error);
      }
      this.moduleManager = undefined!;
    }

    // Уничтожаем ECSManager если он существует с error handling
    if (this.ecsManager) {
      try {
        this.ecsManager.destroy();
      } catch (error) {
        console.error('[Core] Error destroying ECSManager:', error);
      }
      this.ecsManager = null;
    }

    // Уничтожаем tickManager с error handling
    if (this.tickManager) {
      try {
        this.tickManager.destroy();
      } catch (error) {
        console.error('[Core] Error destroying TickManager:', error);
      }
      this.tickManager = undefined!;
    }

    // Уничтожаем eventBus с error handling
    if (this.eventBus) {
      try {
        this.eventBus.clear(); // Используем существующий метод clear()
      } catch (error) {
        console.error('[Core] Error destroying EventBus:', error);
      }
      this.eventBus = undefined!;
    }

    // Уничтожаем Phaser последним с error handling
    if (this.phaser) {
      try {
        this.phaser.destroy(true);
      } catch (error) {
        console.error('[Core] Error destroying Phaser:', error);
      }
      this.phaser = undefined!;
    }
  }

  // Геттеры для обновления ссылок
  setPhaser(phaser: Phaser.Game | undefined): void {
    this.phaser = phaser;
  }

  setResizeHandler(resizeHandler: (() => void) | undefined): void {
    this.resizeHandler = resizeHandler;
  }

  setModuleManager(moduleManager: ModuleManager | undefined): void {
    this.moduleManager = moduleManager;
  }

  setECSManager(ecsManager: ECSManager | null): void {
    this.ecsManager = ecsManager;
  }

  setEventBus(eventBus: EventBus | undefined): void {
    this.eventBus = eventBus;
  }

  setTickManager(tickManager: TickManager | undefined): void {
    this.tickManager = tickManager;
  }
}
