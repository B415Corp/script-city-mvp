import { EventBus } from '@/core/event_bus/event_bus';
import { DebugComponent } from './debug_component';
import { Events } from '@/core/event_bus/events';
import { TimeService } from '@/core/tick/time_service';

export class TickDebug extends DebugComponent {
  // данные
  private tick: number = 0;
  private deltaTime: number = 0;
  private fps: number = 0;
  private timeService: TimeService;

  // DOM элементы
  private tickElement!: HTMLElement;
  private deltaTimeElement!: HTMLElement;
  private fpsElement!: HTMLElement;
  private timeElement!: HTMLElement;

  constructor(scene: Phaser.Scene, eventBus: EventBus, timeService: TimeService) {
    super(scene, eventBus);
    this.timeService = timeService;

    this.eventBus.on(Events.TickStarted, (payload) => {
      if (payload) {
        // Используем данные из события для кадра
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
    this.timeElement = document.getElementById('game-time')!;
  }

  public onActivate(): void {
    this.initDOM();
  }

  public onDeactivate(): void {}

  public createContent(contentContainer: HTMLElement): void {
    this.contentContainer = contentContainer;
    // DOM элементы уже инициализированы в конструкторе
  }

  private updateContent(): void {
    if (!this.tickElement || !this.deltaTimeElement || !this.fpsElement || !this.timeElement) {
      return;
    }

    // Информация о тиках
    this.tickElement.textContent = `• Current tick: ${this.tick}`;
    this.deltaTimeElement.textContent = `• Delta time: ${this.deltaTime}ms`;
    this.fpsElement.textContent = `• FPS: ${this.fps}`;

    // Информация о игровом времени через TimeService
    const timeInfo = this.timeService.getDebugInfo();
    this.timeElement.textContent = `• Game time: ${timeInfo.timeOfDay} Day ${timeInfo.day} (${timeInfo.condition})`;
  }
}
