import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { TickManager } from '../tick/tick_manager';
import { Tiles } from './tiles';
import { ModuleManager } from '../modules/module_manager';
import { Logger } from '../utils/logger';

export class MainScene extends Phaser.Scene {
  private eventBus: EventBus | null = null;
  private tickManager: TickManager | null = null;
  private moduleManager: ModuleManager | null = null;
  private sceneReadyEmitted = false;
  private logger: Logger;

  constructor() {
    super({ key: 'main_scene' });
    this.logger = Logger.create('MainScene');
  }

  preload(): void {
    this.loadTilesTextures();
  }

  init(eventBus: EventBus, tickManager: TickManager): void {
    this.logger.debug('MainScene init called with eventBus:', eventBus, typeof eventBus);
    this.eventBus = eventBus;
    this.tickManager = tickManager;
    this.logger.info('Scene initialized successfully');
  }

  setModuleManager(moduleManager: ModuleManager): void {
    this.moduleManager = moduleManager;
  }

  create(): void {
    this.logger.info('MainScene create');
  }

  update(time: number, delta: number): void {
    if (!this.tickManager) return; // Wait for initialization
    this.tickManager.update(time, delta);

    // Emit SceneReady event on first update if not already emitted
    if (!this.sceneReadyEmitted && this.eventBus && typeof this.eventBus.emit === 'function') {
      this.logger.debug('Emitting SceneReady event from update');
      this.eventBus.emit(Events.SceneReady, undefined);
      this.sceneReadyEmitted = true;
    }

    // Обновляем DebugModule
    if (this.moduleManager) {
      const debugModule = this.moduleManager.getBaseModuleApi('DebugModule') as {
        update?: () => void;
      };
      debugModule?.update?.();
    }
  }

  private loadTilesTextures(): void {
    this.load.setPath('/assets/tiles');

    Object.values(Tiles).forEach((key) => {
      this.load.image(key, `${key}.png`);
    });
  }
}
