import { TimeConditions, ITimeServiceDependencies, TimeDebugInfo } from './types';
import { GameTimeUpdateData } from '../ecs/types';
import { TimeController } from './controllers/time_controller';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';
import { GAME_TIME_PER_TICK } from '../ecs/ecs_manager';

/**
 * TimeService - централизованный сервис для работы с игровым временем
 * Обеспечивает единый интерфейс для всех систем и компонентов
 *
 * Новая версия: эмитит события напрямую через типобезопасный EventBus
 *
 * Использование:
 * ```typescript
 * // Для компонентов с прямым доступом к EventBus
 * const timeService = new TimeService(eventBus);
 *
 * // Для тестирования
 * const timeService = TimeService.createTestInstance(9 * 60); // 9:00
 * ```
 */
export class TimeService {
  private currentTick = 0;
  private currentTime = 0;
  private currentDay = 1;
  private currentWeek = 1;

  constructor(
    private eventBus: EventBus,
    initialTime = 8 * 60, // 8:00
  ) {
    this.currentTime = initialTime;
  }

  /**
   * Эмитить обновление времени (основной метод для тиков)
   */
  tick(): void {
    this.currentTick++;
    // Прибавляем время на основе GAME_TIME_PER_TICK (переводим ms в минуты)
    const increment = GAME_TIME_PER_TICK / 1000 / 60;
    this.currentTime += increment;

    console.log(`[TimeService] tick() - increment: ${increment}, currentTime: ${this.currentTime}`);

    // Эмитим обновление игрового времени (аналогично TimeController)
    const timeData = this.getTimeData();
    this.eventBus.emit(Events.GameTimeUpdated, timeData);
  }

  /**
   * Получить полные данные времени
   */
  getTimeData(): GameTimeUpdateData {
    const minutesOfDay = this.currentTime % 1440;
    const day = Math.floor(this.currentTime / 1440) + 1;
    const hours = Math.floor(minutesOfDay / 60);
    const minutes = Math.floor(minutesOfDay % 60);

    return {
      totalMinutes: this.currentTime,
      minutesOfDay,
      timeOfDay: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      date: this.formatDate(day),
      day,
      year: 2000, // Упрощаем для базовой версии
      month: 1,
      dayOfMonth: day,
      hour: hours,
      minute: minutes,
    };
  }

  /**
   * Установить время (для тестов)
   */
  setTime(minutes: number): void {
    this.currentTime = Math.max(0, Math.min(1440 * 365, minutes)); // Ограничиваем разумными пределами
  }

  /**
   * Получить текущий час (0-23)
   */
  getHour(): number {
    return this.getTimeData().hour;
  }

  /**
   * Получить минуты от начала дня
   */
  getMinutesOfDay(): number {
    return this.getTimeData().minutesOfDay;
  }

  /**
   * Получить номер дня
   */
  getDay(): number {
    return Math.floor(this.currentTime / 1440) + 1;
  }

  /**
   * Проверить, является ли время утренним (6:00-12:00)
   */
  isMorningTime(): boolean {
    const hour = this.getHour();
    return hour >= 6 && hour < 12;
  }

  /**
   * Проверить, является ли время дневным (12:00-18:00)
   */
  isAfternoonTime(): boolean {
    const hour = this.getHour();
    return hour >= 12 && hour < 18;
  }

  /**
   * Проверить, является ли время вечерним (18:00-22:00)
   */
  isEveningTime(): boolean {
    const hour = this.getHour();
    return hour >= 18 && hour < 22;
  }

  /**
   * Проверить, является ли время ночным (22:00-6:00)
   */
  isNightTime(): boolean {
    const hour = this.getHour();
    return hour >= 22 || hour < 6;
  }

  /**
   * Проверить, являются ли текущие часы рабочими (9:00-17:00)
   */
  isWorkHours(): boolean {
    const hour = this.getHour();
    return hour >= 9 && hour < 17;
  }

  /**
   * Проверить, является ли время подходящим для увольнения (18:00-20:00)
   */
  isFiringTime(): boolean {
    const hour = this.getHour();
    return hour >= 18 && hour < 20;
  }

  /**
   * Проверить, является ли день выходным (суббота, воскресенье)
   */
  isWeekend(): boolean {
    const dayOfWeek = this.getDayOfWeek();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = воскресенье, 6 = суббота
  }

  /**
   * Получить день недели (0 = воскресенье, 1 = понедельник, ..., 6 = суббота)
   */
  getDayOfWeek(): number {
    // День 1 = понедельник (1), день 2 = вторник (2), ..., день 7 = воскресенье (0)
    // День 8 = понедельник (1) и т.д.
    const day = this.getDay();
    return (((day - 1) % 7) + 1) % 7; // 1=пн, 2=вт, ..., 7=вс(0)
  }

  /**
   * Получить текущую фазу времени
   */
  getCurrentTimeCondition(): TimeConditions {
    if (this.isMorningTime()) return TimeConditions.MORNING;
    if (this.isAfternoonTime()) return TimeConditions.AFTERNOON;
    if (this.isEveningTime()) return TimeConditions.EVENING;
    return TimeConditions.NIGHT;
  }

  /**
   * Проверить, соответствует ли время условию
   */
  matchesCondition(condition: TimeConditions): boolean {
    switch (condition) {
      case TimeConditions.MORNING:
        return this.isMorningTime();
      case TimeConditions.AFTERNOON:
        return this.isAfternoonTime();
      case TimeConditions.EVENING:
        return this.isEveningTime();
      case TimeConditions.NIGHT:
        return this.isNightTime();
      case TimeConditions.WORK_HOURS:
        return this.isWorkHours();
      case TimeConditions.FIRING_TIME:
        return this.isFiringTime();
      default:
        return false;
    }
  }

  /**
   * Получить информацию для отладки
   */
  getDebugInfo(): TimeDebugInfo {
    const timeData = this.getTimeData();
    return {
      totalMinutes: timeData.totalMinutes,
      timeOfDay: timeData.timeOfDay,
      date: timeData.date,
      day: timeData.day,
      hour: timeData.hour,
      minute: timeData.minute,
      condition: this.getCurrentTimeCondition(),
      isWorkHours: this.isWorkHours(),
      isWeekend: this.isWeekend(),
    };
  }

  /**
   * Преобразовать в читаемую строку
   */
  toString(): string {
    const data = this.getTimeData();
    return `${data.timeOfDay} Day ${data.day} (${data.date})`;
  }

  /**
   * Форматировать дату в DD.MM.YYYY
   */
  private formatDate(day: number): string {
    // Упрощенная версия для базовой реализации
    const dayOfMonth = ((day - 1) % 31) + 1;
    const month = 1; // Фиксируем январь для простоты
    const year = 2000;

    const dayStr = dayOfMonth.toString().padStart(2, '0');
    const monthStr = month.toString().padStart(2, '0');
    return `${dayStr}.${monthStr}.${year}`;
  }

  /**
   * Геттеры для прямого доступа к внутреннему состоянию
   */
  getTick(): number {
    return this.currentTick;
  }

  getTime(): number {
    return this.currentTime;
  }

  getWeek(): number {
    return this.currentWeek;
  }

  /**
   * Создать тестовый TimeService (без EventBus)
   */
  static createTestInstance(initialTime = 8 * 60): TimeService {
    // Создаем mock EventBus для тестов
    const mockEventBus = {
      emit: () => {}, // No-op для тестов
      on: (): (() => void) => () => {},
      off: (): void => {},
      once: (): (() => void) => () => {},
      clear: (): void => {},
      getListenerCount: (): number => 0,
      emitLegacy: (): void => {},
      onLegacy: (): { unsubscribe: () => void } => ({ unsubscribe: (): void => {} }),
      clearEvents: (): void => {},
    } as unknown as EventBus;

    const service = new TimeService(mockEventBus, initialTime);
    return service;
  }
}
