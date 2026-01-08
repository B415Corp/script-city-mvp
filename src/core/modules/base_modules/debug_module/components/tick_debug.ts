import { EventBus } from '@/core/event_bus/event_bus';
import { DebugComponent } from './debug_component';
import { Events } from '@/core/event_bus/events';

export class TickDebug extends DebugComponent {
  // данные
  private tick: number = 0;
  private deltaTime: number = 0;
  private fps: number = 0;

  // DOM элементы
  private tickElement!: HTMLElement;
  private deltaTimeElement!: HTMLElement;
  private fpsElement!: HTMLElement;

  constructor(scene: Phaser.Scene, eventBus: EventBus) {
    super(scene, eventBus);
    this.initDOM();

    this.eventBus.on(Events.TickStarted, (payload) => {
      if (payload) {
        this.tick = payload.time;
        this.deltaTime = Math.round(payload.delta);
        this.fps = Math.round(1000 / payload.delta);

        this.updateContent();
      }
    });
  }

  private initDOM(): void {
    this.tickElement = document.getElementById('current-tick')!;
    this.deltaTimeElement = document.getElementById('delta-time')!;
    this.fpsElement = document.getElementById('fps')!;
  }

  public onActivate(): void {}

  public onDeactivate(): void {}

  public createContent(contentContainer: HTMLElement): void {
    this.contentContainer = contentContainer;
    // DOM элементы уже инициализированы в конструкторе
  }

  private updateContent(): void {
    if (!this.tickElement || !this.deltaTimeElement || !this.fpsElement) {
      return;
    }
    this.tickElement.textContent = `• Current tick: ${this.tick}`;
    this.deltaTimeElement.textContent = `• Delta time: ${this.deltaTime}ms`;
    this.fpsElement.textContent = `• FPS: ${this.fps}`;
  }
}
