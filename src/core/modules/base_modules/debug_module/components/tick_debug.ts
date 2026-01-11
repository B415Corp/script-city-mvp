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

  constructor(scene: Phaser.Scene, eventBus: EventBus, timeService: TimeService) {
    super(scene, eventBus);
    this.timeService = timeService;

    this.eventBus.on(Events.TickStarted, (payload) => {
      if (payload) {
        // Используем данные из события для кадра
        this.tick = this.timeService.getTick();
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

  public onActivate(): void {
    this.initDOM();
  }

  public onDeactivate(): void {}

  public createContent(contentContainer: HTMLElement): void {
    this.contentContainer = contentContainer;
    // DOM элементы уже инициализированы в конструкторе
  }

  private updateContent(): void {
    if (!this.tickElement || !this.deltaTimeElement || !this.fpsElement) {
      return;
    }

    // Информация о тиках (на русском языке как в HTML)
    this.tickElement.textContent = `• Текущий тик: ${this.tick}`;
    this.deltaTimeElement.textContent = `• Время кадра: ${this.deltaTime}мс`;
    this.fpsElement.textContent = `• FPS: ${this.fps}`;
  }
}
