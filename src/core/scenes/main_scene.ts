import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { Tiles } from './tiles';

class MainScene extends Phaser.Scene {
  private eventBus!: EventBus;

  constructor() {
    super({ key: 'main_scene' });
  }
  preload(): void {
    // Загрузка текстур тайлов для карты
    this.loadTilesTextures();
  }

  init(eventBus: EventBus): void {
    this.eventBus = eventBus;
  }

  create(): void {
    console.log('MainScene create');
    this.eventBus.emit(Events.SceneReady, {});
  }

  update(time: number, delta: number): void {
    this.eventBus.emit(Events.TickStarted, { time, delta });
    // Этот метод вызывается каждый кадр
    // console.log('Tick', time, delta);
  }

  private loadTilesTextures(): void {
    // Загрузка тайлов из Tiles
    this.load.setPath('/assets/tiles');

    Object.values(Tiles).forEach((key) => {
      this.load.image(key, `${key}.png`);
    });
  }
}

export default MainScene;
