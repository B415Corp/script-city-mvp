import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { TickManager } from '../tick/tick_manager';
import { Tiles } from './tiles';
import { ModuleManager } from '../modules/module_manager';

export class MainScene extends Phaser.Scene {
  private eventBus!: EventBus;
  private tickManager!: TickManager;
  private moduleManager!: ModuleManager; // Для доступа к DebugModule
  private sceneReadyEmitted = false;

  constructor() {
    super({ key: 'main_scene' });
  }

  preload(): void {
    this.loadTilesTextures();
  }

  init(eventBus: EventBus, tickManager: TickManager): void {
    console.log('MainScene init called with eventBus:', eventBus, typeof eventBus);
    this.eventBus = eventBus;
    this.tickManager = tickManager;
    console.log('Scene initialized successfully');
  }

  setModuleManager(moduleManager: ModuleManager): void {
    this.moduleManager = moduleManager;
  }

  create(): void {
    console.log('MainScene create');
  }

  update(time: number, delta: number): void {
    this.tickManager.update(time, delta);

    // Emit SceneReady event on first update if not already emitted
    if (!this.sceneReadyEmitted && this.eventBus && typeof this.eventBus.emit === 'function') {
      console.log('Emitting SceneReady event from update');
      this.eventBus.emit(Events.SceneReady);
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
