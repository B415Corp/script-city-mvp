import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { Tiles } from './tiles';

export class MainScene extends Phaser.Scene {
  private eventBus!: EventBus;
  private accumulator = 0;
  private fixedStep = 1000 / 10; // 1 тиков в секунду

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
    this.eventBus.on(Events.GamePauseToggle, () => {
      this.fixedStep = 1000 / 0;
    });
    this.eventBus.on(Events.SetGameSpeed, (payload) => {
      const { speed } = payload as { speed: number };
      this.fixedStep = 1000 / speed;
    });
  }

  update(time: number, delta: number): void {
    this.eventBus.emit(Events.TickStarted, { time, delta });
    // Этот метод вызывается каждый кадр
    // console.log('Tick', time, delta);

    this.accumulator += delta;

    while (this.accumulator >= this.fixedStep) {
      this.accumulator -= this.fixedStep;

      this.eventBus.emit(Events.LogicTick, {
        time,
        delta: this.fixedStep,
      });
    }
  }

  private loadTilesTextures(): void {
    // Загрузка тайлов из Tiles
    this.load.setPath('/assets/tiles');

    Object.values(Tiles).forEach((key) => {
      this.load.image(key, `${key}.png`);
    });
  }
}
