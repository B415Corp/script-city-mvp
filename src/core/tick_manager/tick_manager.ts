import { TickManagerConfig } from './types';

export class TickManager {
  private config: TickManagerConfig;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private currentTick: number = 0;
  private gameTime: number = 0; // в тиках
  private realTime: number = 0; // в миллисекундах
  private speedMultiplier: number = 1.0; // множитель скорости (1.0 = нормальная, 0.0 = пауза)
  private speedLocks: Map<string, string | undefined> = new Map(); // lockId -> reason
  private accumulatedTime: number = 0; // накопленное время для фиксированного шага
  private tickInterval: number; // интервал одного тика в миллисекундах

  constructor(config: TickManagerConfig) {
    this.config = config;
    this.tickInterval = 1000 / config.tickRate; // миллисекунды на тик
    console.warn('⏱️ TickManager initialized', { tickRate: config.tickRate });
  }

  update(delta: number): void {
    console.warn('TickManager updated', delta);
  }

  /**
   * Запуск цикла тиков.
   * В MVP интегрирован с Phaser, поэтому реальный цикл запускается через updateFromPhaser.
   */
  start(): void {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.isPaused = false;
    this.realTime = 0;
    console.warn('⏱️ TickManager started');
  }

  /**
   * Остановка цикла тиков.
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }
    this.isRunning = false;
    this.isPaused = false;
    console.warn('⏱️ TickManager stopped');
  }

  /**
   * Приостановка симуляции (пауза).
   */
  pause(): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }
    this.isPaused = true;
    this.config.eventBus.emit('SimulationPaused');
    console.warn('⏱️ TickManager paused');
  }

  /**
   * Возобновление симуляции после паузы.
   */
  resume(): void {
    if (!this.isRunning || !this.isPaused) {
      return;
    }
    this.isPaused = false;
    this.config.eventBus.emit('SimulationResumed');
    console.warn('⏱️ TickManager resumed');
  }

  /**
   * Установка множителя скорости.
   * @param multiplier - множитель скорости (1.0 = нормальная, 2.0 = 2x, 0.0 = пауза)
   * @returns true если скорость успешно установлена, false если заблокирована
   */
  setSpeed(multiplier: number): boolean {
    if (this.isSpeedChangeLocked()) {
      console.warn('⏱️ TickManager: speed change blocked', this.getSpeedChangeLocks());
      return false;
    }

    const oldSpeed = this.speedMultiplier;
    this.speedMultiplier = Math.max(0, multiplier);

    // Если скорость = 0, автоматически ставим на паузу
    if (this.speedMultiplier === 0 && !this.isPaused) {
      this.pause();
    } else if (this.speedMultiplier > 0 && this.isPaused) {
      this.resume();
    }

    if (oldSpeed !== this.speedMultiplier) {
      this.config.eventBus.emit('SpeedChanged', {
        oldSpeed,
        newSpeed: this.speedMultiplier,
      });
      console.warn('⏱️ TickManager: speed changed', oldSpeed, '->', this.speedMultiplier);
    }

    return true;
  }

  /**
   * Обновление от Phaser (вызывается из GameScene.update).
   * Выполняет фиксированный шаг симуляции с компенсацией лагов.
   * @param deltaMs - время, прошедшее с последнего кадра, в миллисекундах
   */
  updateFromPhaser(deltaMs: number): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    // Обновляем реальное время
    this.realTime += deltaMs;

    // Учитываем множитель скорости
    const scaledDelta = deltaMs * this.speedMultiplier;

    // Накапливаем время для фиксированного шага
    this.accumulatedTime += scaledDelta;

    // Вычисляем, сколько тиков нужно выполнить
    const ticksToProcess = Math.floor(this.accumulatedTime / this.tickInterval);
    const maxTicks = this.config.maxCatchUpTicks;

    // Ограничиваем количество тиков для предотвращения спирали смерти
    const ticksToExecute = Math.min(ticksToProcess, maxTicks);

    // Выполняем тики
    for (let i = 0; i < ticksToExecute; i++) {
      this.tick();
    }

    // Сохраняем остаток времени для следующего кадра
    this.accumulatedTime -= ticksToExecute * this.tickInterval;

    // Если накопилось слишком много времени (лаги), предупреждаем
    if (this.accumulatedTime > this.tickInterval * 2) {
      console.warn('⏱️ TickManager: lag detected, accumulated time:', this.accumulatedTime);
    }
  }

  /**
   * Выполнение одного тика симуляции.
   * Вызывается внутренне из updateFromPhaser.
   */
  private tick(): void {
    // Публикуем событие начала тика
    this.config.eventBus.emit('TickStarted', {
      tick: this.currentTick,
      gameTime: this.gameTime,
    });

    // Обработка команд в начале тика (до фазы симуляции)
    if (this.config.commandProcessor) {
      this.config.commandProcessor.processCommands();
    }

    // Запуск систем ECS (фаза симуляции)
    if (this.config.ecsManager) {
      this.config.ecsManager.runSystems(1, this.config.eventBus);
    }

    // Увеличиваем счётчики
    this.currentTick++;
    this.gameTime++;

    // Публикуем событие конца тика
    this.config.eventBus.emit('TickEnded', {
      tick: this.currentTick - 1,
      gameTime: this.gameTime - 1,
    });
  }

  /**
   * Получение номера текущего тика.
   */
  getCurrentTick(): number {
    return this.currentTick;
  }

  /**
   * Получение игрового времени в тиках.
   */
  getGameTime(): number {
    return this.gameTime;
  }

  /**
   * Получение реального времени в миллисекундах.
   */
  getRealTime(): number {
    return this.realTime;
  }

  /**
   * Блокировка изменения скорости.
   * @param lockId - уникальный идентификатор блокировки
   * @param reason - опциональная причина блокировки (для отладки)
   */
  lockSpeedChange(lockId: string, reason?: string): void {
    if (this.speedLocks.has(lockId)) {
      return; // уже заблокировано этим ID
    }

    this.speedLocks.set(lockId, reason);
    this.config.eventBus.emit('SpeedChangeLocked', { lockId, reason });
    console.warn('⏱️ TickManager: speed change locked', lockId, reason);
  }

  /**
   * Разблокировка изменения скорости.
   * @param lockId - идентификатор блокировки для снятия
   */
  unlockSpeedChange(lockId: string): void {
    if (!this.speedLocks.has(lockId)) {
      return; // блокировка не существует
    }

    this.speedLocks.delete(lockId);
    this.config.eventBus.emit('SpeedChangeUnlocked', { lockId });
    console.warn('⏱️ TickManager: speed change unlocked', lockId);
  }

  /**
   * Проверка, заблокировано ли изменение скорости.
   */
  isSpeedChangeLocked(): boolean {
    return this.speedLocks.size > 0;
  }

  /**
   * Получение списка активных блокировок (для отладки).
   */
  getSpeedChangeLocks(): string[] {
    return Array.from(this.speedLocks.keys());
  }

  /**
   * Получение текущего множителя скорости.
   */
  getSpeed(): number {
    return this.speedMultiplier;
  }

  /**
   * Проверка, запущен ли TickManager.
   */
  isActive(): boolean {
    return this.isRunning && !this.isPaused;
  }
}
