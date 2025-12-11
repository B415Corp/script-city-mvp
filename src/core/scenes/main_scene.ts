import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';

class MainScene extends Phaser.Scene {
  private eventBus!: EventBus;

  constructor() {
    super({ key: 'main_scene' });
  }

  init(eventBus: EventBus): void {
    this.eventBus = eventBus;
  }

  create(): void {
    console.log('MainScene create');
  }

  update(time: number, delta: number): void {
    this.eventBus.emit(Events.TickStarted, { time, delta });
    // Этот метод вызывается каждый кадр
    // console.log('Tick', time, delta);
  }
}

export default MainScene;
