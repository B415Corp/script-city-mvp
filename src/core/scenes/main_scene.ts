import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { TickManager } from '../tick/tick_manager';
import { Tiles } from './tiles';

export class MainScene extends Phaser.Scene {
  private eventBus!: EventBus;
  private tickManager!: TickManager;
  private moduleManager!: any; // Для доступа к DebugModule

  constructor() {
    super({ key: 'main_scene' });
  }

  preload(): void {
    this.loadTilesTextures();
  }

  init(eventBus: EventBus, tickManager: TickManager): void {
    this.eventBus = eventBus;
    this.tickManager = tickManager;
  }

  setModuleManager(moduleManager: any): void {
    this.moduleManager = moduleManager;
  }

  create(): void {
    console.log('MainScene create');

    this.eventBus.emit(Events.SceneReady);
  }

  update(time: number, delta: number): void {
    this.tickManager.update(time, delta);

    // Обновляем DebugModule
    if (this.moduleManager) {
      const debugModule = this.moduleManager.getBaseModuleApi('DebugModule');
      debugModule?.update();
    }
  }

  private loadTilesTextures(): void {
    this.load.setPath('/assets/tiles');

    Object.values(Tiles).forEach((key) => {
      this.load.image(key, `${key}.png`);
    });
  }
}
