import { GameSpeeds } from '../types';

/**
 * Контроллер для управления fixed timestep логикой
 * Отвечает за accumulator, fixed step и паузу
 */
export class TickController {
  private accumulator = 0; // накопленное время
  private tickRate = GameSpeeds.NORMAL; // тиков в секунду
  private fixedStepMs = 1000 / GameSpeeds.NORMAL; // ms на тик
  private paused = false;

  // чтобы при лагах не догонять вечность
  private readonly maxAccumulatedMs = 250;

  constructor(initialTickRate = 10) {
    this.setSpeed(initialTickRate);
  }

  /**
   * Обновляет accumulator и возвращает количество тиков для выполнения
   */
  update(delta: number): number {
    if (this.paused) return 0;

    // Защита от огромного delta (свернули вкладку и т.п.)
    this.accumulator += Math.min(delta, this.maxAccumulatedMs);

    let ticksToExecute = 0;

    // считаем сколько тиков нужно выполнить
    while (this.accumulator >= this.fixedStepMs) {
      this.accumulator -= this.fixedStepMs;
      ticksToExecute++;
    }

    return ticksToExecute;
  }

  /**
   * Устанавливает скорость тиков
   */
  setSpeed(speed: GameSpeeds | number): void {
    // speed = пауза
    if (speed === GameSpeeds.PAUSED || !Number.isFinite(speed) || speed <= 0) {
      this.paused = true;
      return;
    }

    this.paused = false;
    this.tickRate = speed;
    this.fixedStepMs = 1000 / speed;
  }

  /**
   * Переключает паузу
   */
  togglePause(): void {
    this.paused = !this.paused;
  }

  /**
   * Ставит на паузу
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Возобновляет
   */
  resume(): void {
    this.paused = false;
  }

  /**
   * Возвращает текущий fixed step в миллисекундах
   */
  getFixedStepMs(): number {
    return this.fixedStepMs;
  }

  /**
   * Возвращает текущую скорость тиков
   */
  getTickRate(): number {
    return this.tickRate;
  }

  /**
   * Проверяет, находится ли в паузе
   */
  isPaused(): boolean {
    return this.paused;
  }
}
