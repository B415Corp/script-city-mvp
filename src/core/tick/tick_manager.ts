import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';

type SetSpeedPayload = { speed: number };

export class TickManager {
  private accumulator = 0; // накопленное время

  private tickRate = 10; // тиков в секунду
  private fixedStepMs = 1000 / 10; // ms на тик

  private paused = false;

  // чтобы при лагах не догонять вечность
  private maxAccumulatedMs = 250;

  constructor(
    private readonly eventBus: EventBus,
    initialTickRate = 10,
  ) {
    this.setSpeed(initialTickRate); // установить начальную скорость тиков

    this.eventBus.on(Events.GamePauseToggle, () => this.togglePause());
    this.eventBus.on(Events.SetGameSpeed, (payload) => {
      const { speed } = payload as SetSpeedPayload;
      this.setSpeed(speed);
    });
  }

  // обновление тиков
  update(time: number, delta: number): void {
    // “TickStarted” можно оставить как кадр-событие (каждый rAF)
    this.eventBus.emit(Events.TickStarted, { time, delta });

    if (this.paused) return;

    // Защита от огромного delta (свернули вкладку и т.п.)
    this.accumulator += Math.min(delta, this.maxAccumulatedMs);

    // пока накопленное время больше или равно фиксированному шагу, выполняем логику тика
    while (this.accumulator >= this.fixedStepMs) {
      this.accumulator -= this.fixedStepMs;

      this.eventBus.emit(Events.LogicTick, {
        time,
        delta: this.fixedStepMs,
      });
    }
  }

  // установить скорость тиков
  setSpeed(speed: number): void {
    // speed = пауза
    if (!Number.isFinite(speed) || speed <= 0) {
      this.paused = true;
      return;
    }

    this.paused = false;
    this.tickRate = speed;
    this.fixedStepMs = 1000 / speed;
  }

  // переключить паузу
  togglePause(): void {
    this.paused = !this.paused;
  }

  // пауза
  pause(): void {
    this.paused = true;
  }

  // возобновить
  resume(): void {
    this.paused = false;
  }

  // получить фиксированный шаг в миллисекундах
  getFixedStepMs(): number {
    return this.fixedStepMs;
  }
}
