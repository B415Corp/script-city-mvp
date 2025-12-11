import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';

class MainScene extends Phaser.Scene {
  private eventBus!: EventBus;

  constructor() {
    super({ key: 'main_scene' });
  }
  preload(): void {
    this.load.image('GRASS_BASE_0', 'src/assets/tiles/GRASS_BASE_0.png');
    this.load.image('SAND_BASE_0', 'src/assets/tiles/SAND_BASE_0.png');
    this.load.image('SNOW_BASE_0', 'src/assets/tiles/SNOW_BASE_0.png');
    this.load.image('FOREST_BASE_0', 'src/assets/tiles/FOREST_BASE_0.png');
    this.load.image('MOUNTAIN_BASE_0', 'src/assets/tiles/MOUNTAIN_BASE_0.png');
  }

  init(eventBus: EventBus): void {
    this.eventBus = eventBus;
  }

  create(): void {
    console.log('MainScene create');
    console.log(this.textures.exists('GRASS_BASE_0'));
    console.log(this.textures.exists('SAND_BASE_0'));
  }

  update(time: number, delta: number): void {
    this.eventBus.emit(Events.TickStarted, { time, delta });
    // Этот метод вызывается каждый кадр
    // console.log('Tick', time, delta);
  }
}

export default MainScene;
