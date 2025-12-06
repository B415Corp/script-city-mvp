import { TickManagerConfig } from './types';
import { Events } from '../event_bus/events';
import { debugLog, debugGroup, debugGroupEnd } from '@/infrastructure/utils/logger';

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
  private ticksPerSecondCounter: number = 0; // счетчик тиков за последнюю секунду
  private ticksPerSecondTimer: number = 0; // таймер для подсчета тиков в секунду

  constructor(config: TickManagerConfig) {
    debugLog('⏱️ TickManager создан');
    this.config = config;
    this.tickInterval = 1000 / config.tickRate; // миллисекунды на тик
  }

  update(): void {
    // Метод для совместимости, не используется в MVP
  }

  /**
   * Запуск цикла тиков.
   * В MVP интегрирован с Phaser, поэтому реальный цикл запускается через updateFromPhaser.
   */
  start(): void {
    if (this.isRunning) {
      debugLog('⏱️ TickManager: уже запущен');
      return;
    }
    debugGroup('⏱️ TickManager: запуск');
    this.isRunning = true;
    this.isPaused = false;
    this.realTime = 0;
    this.ticksPerSecondCounter = 0;
    this.ticksPerSecondTimer = 0;
    debugLog('TickManager запущен', {
      tickRate: this.config.tickRate,
      maxCatchUpTicks: this.config.maxCatchUpTicks,
    });
    debugGroupEnd();
  }

  /**
   * Остановка цикла тиков.
   */
  stop(): void {
    if (!this.isRunning) {
      debugLog('⏱️ TickManager: уже остановлен');
      return;
    }
    debugGroup('⏱️ TickManager: остановка');
    this.isRunning = false;
    this.isPaused = false;
    debugLog('TickManager остановлен', {
      currentTick: this.currentTick,
      gameTime: this.gameTime,
    });
    debugGroupEnd();
  }

  /**
   * Приостановка симуляции (пауза).
   */
  pause(): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }
    debugLog('⏱️ TickManager: пауза', { currentTick: this.currentTick });
    this.isPaused = true;
    this.config.eventBus.emit(Events.SimulationPaused);
  }

  /**
   * Возобновление симуляции после паузы.
   */
  resume(): void {
    if (!this.isRunning || !this.isPaused) {
      return;
    }
    debugLog('⏱️ TickManager: возобновление', { currentTick: this.currentTick });
    this.isPaused = false;
    this.config.eventBus.emit(Events.SimulationResumed);
  }

  /**
   * Установка множителя скорости.
   * @param multiplier - множитель скорости (1.0 = нормальная, 2.0 = 2x, 0.0 = пауза)
   * @returns true если скорость успешно установлена, false если заблокирована
   */
  setSpeed(multiplier: number): boolean {
    if (this.isSpeedChangeLocked()) {
      debugLog('⏱️ TickManager: изменение скорости заблокировано', {
        requestedSpeed: multiplier,
        locks: this.getSpeedChangeLocks(),
      });
      return false;
    }

    const oldSpeed = this.speedMultiplier;
    const wasPaused = this.isPaused;
    this.speedMultiplier = Math.max(0, multiplier);

    // Если скорость = 0, автоматически ставим на паузу
    if (this.speedMultiplier === 0) {
      if (!this.isPaused) {
        this.pause();
      }
    } else {
      // Если скорость > 0, снимаем с паузы если нужно
      if (this.isPaused) {
        this.resume();
      }
    }

    // Отправляем событие если изменилась скорость или состояние паузы
    const speedChanged = oldSpeed !== this.speedMultiplier;
    const pauseStateChanged = wasPaused !== this.isPaused;

    if (speedChanged || pauseStateChanged) {
      // Нормализуем accumulatedTime при изменении скорости
      // Это предотвращает артефакты от накопленного времени со старой скоростью
      if (speedChanged && oldSpeed > 0 && this.speedMultiplier > 0) {
        // Масштабируем accumulatedTime пропорционально изменению скорости
        // Это сохраняет правильное соотношение времени при изменении скорости
        this.accumulatedTime = (this.accumulatedTime / oldSpeed) * this.speedMultiplier;
      }

      debugLog('⏱️ TickManager: скорость изменена', {
        oldSpeed,
        newSpeed: this.speedMultiplier,
        pauseStateChanged,
      });

      this.config.eventBus.emit(Events.SpeedChanged, {
        oldSpeed,
        newSpeed: this.speedMultiplier,
      });
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

    // Обновляем счетчик тиков в секунду
    this.ticksPerSecondTimer += deltaMs;
    if (this.ticksPerSecondTimer >= 1000) {
      // Сбрасываем счетчик каждую секунду
      this.ticksPerSecondCounter = 0;
      this.ticksPerSecondTimer = 0;
    }

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
  }

  /**
   * Выполнение одного тика симуляции.
   * Вызывается внутренне из updateFromPhaser.
   */
  private tick(): void {
    // Увеличиваем счетчик тиков в секунду
    this.ticksPerSecondCounter++;

    // Публикуем событие начала тика
    this.config.eventBus.emit(Events.TickStarted, {
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
    this.config.eventBus.emit(Events.TickEnded, {
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
    debugLog('⏱️ TickManager: изменение скорости заблокировано', { lockId, reason });
    this.config.eventBus.emit(Events.SpeedChangeLocked, { lockId, reason });
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
    debugLog('⏱️ TickManager: блокировка изменения скорости снята', { lockId });
    this.config.eventBus.emit(Events.SpeedChangeUnlocked, { lockId });
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

  /**
   * Получение базового tick rate (тиков в секунду при скорости 1x).
   */
  getTickRate(): number {
    return this.config.tickRate;
  }

  /**
   * Получение эффективного tick rate (тиков в секунду с учетом скорости).
   */
  getEffectiveTickRate(): number {
    if (this.isPaused) {
      return 0;
    }
    return this.config.tickRate * this.speedMultiplier;
  }

  /**
   * Получение количества тиков в секунду (реальное значение).
   */
  getTicksPerSecond(): number {
    return this.ticksPerSecondCounter;
  }
}
