import { GameTimeUpdateData } from '../../ecs/types';
import { EventBus } from '../../event_bus/event_bus';
import { Events } from '../../event_bus/events';

/**
 * Контроллер для управления игровым временем
 * Отвечает за подсчет игрового времени, дней, даты, форматирование
 */
export class TimeController {
  private gameTime = 8 * 60; // общее игровое время в минутах (стартуем с 8:00 первого дня)

  // Константы времени
  private readonly MINUTES_PER_DAY = 24 * 60; // 1440 минут в сутках
  private readonly MINUTES_PER_TICK = 15; // 15 минут игры за 1 логический тик

  // Дата начала игры: 01.01.2000
  private readonly START_YEAR = 2000;
  private readonly START_MONTH = 1;
  private readonly START_DAY = 1;

  constructor(
    private readonly eventBus: EventBus,
    initialTimeMinutes = 8 * 60,
  ) {
    this.gameTime = initialTimeMinutes;
  }

  /**
   * Получить время дня (минуты от начала текущего дня)
   */
  private get gameTimeOfDay(): number {
    return this.gameTime % this.MINUTES_PER_DAY;
  }

  /**
   * Обновляет игровое время на один тик
   */
  tick(): void {
    this.gameTime += this.MINUTES_PER_TICK;
  }

  /**
   * Эмитит обновление времени в eventBus
   */
  emitTimeUpdate(): void {
    const timeData = this.getTimeUpdateData();
    this.eventBus.emit(Events.GameTimeUpdated, timeData);
  }

  /**
   * Возвращает данные обновления времени для UI
   */
  getTimeUpdateData(): GameTimeUpdateData {
    const { year, month, dayOfMonth } = this.calculateDate();
    const totalDays = Math.floor(this.gameTime / this.MINUTES_PER_DAY);
    const day = totalDays + 1; // Общий номер дня
    const hours = Math.floor(this.gameTimeOfDay / 60);
    const minutes = Math.floor(this.gameTimeOfDay % 60);

    return {
      totalMinutes: this.gameTime,
      timeOfDay: this.formatTimeOfDay(this.gameTimeOfDay),
      date: this.formatDate(year, month, dayOfMonth),
      day,
      year,
      month,
      dayOfMonth,
      hour: hours,
      minute: minutes,
      minutesOfDay: this.gameTimeOfDay,
    };
  }

  /**
   * Рассчитать текущую дату игры
   */
  private calculateDate(): { year: number; month: number; dayOfMonth: number } {
    const totalDays = Math.floor(this.gameTime / this.MINUTES_PER_DAY);

    // Начинаем с 01.01.2000
    let year = this.START_YEAR;
    let month = this.START_MONTH;
    let dayOfMonth = this.START_DAY;

    let remainingDays = totalDays;

    // Добавляем прошедшие дни к начальной дате
    dayOfMonth += remainingDays;

    // Корректируем месяцы и годы
    while (dayOfMonth > this.getDaysInMonth(year, month)) {
      dayOfMonth -= this.getDaysInMonth(year, month);
      month++;

      if (month > 12) {
        month = 1;
        year++;
      }
    }

    return { year, month, dayOfMonth };
  }

  /**
   * Получить количество дней в месяце с учетом високосных годов
   */
  private getDaysInMonth(year: number, month: number): number {
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Проверяем февраль в високосный год
    if (month === 2 && this.isLeapYear(year)) {
      return 29;
    }

    return daysInMonth[month - 1];
  }

  /**
   * Проверить, является ли год високосным
   */
  private isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  /**
   * Форматировать дату в DD.MM.YYYY
   */
  private formatDate(year: number, month: number, dayOfMonth: number): string {
    const dayStr = dayOfMonth.toString().padStart(2, '0');
    const monthStr = month.toString().padStart(2, '0');
    return `${dayStr}.${monthStr}.${year}`;
  }

  /**
   * Форматирует время дня в читаемый формат HH:MM
   */
  private formatTimeOfDay(minutesOfDay: number): string {
    const hours = Math.floor(minutesOfDay / 60);
    const minutes = Math.floor(minutesOfDay % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Получить статистику времени
   */
  getStats(): {
    gameTime: number;
    gameTimeOfDay: string;
    day: number;
  } {
    const day = Math.floor(this.gameTime / this.MINUTES_PER_DAY) + 1;

    return {
      gameTime: Math.floor(this.gameTime),
      gameTimeOfDay: this.formatTimeOfDay(this.gameTimeOfDay),
      day,
    };
  }

  /**
   * Установить игровое время (для тестов или загрузки)
   */
  setGameTime(minutes: number): void {
    this.gameTime = minutes;
  }

  /**
   * Получить текущее игровое время в минутах
   */
  getGameTime(): number {
    return this.gameTime;
  }

  /**
   * Получить время дня в минутах
   */
  getGameTimeOfDay(): number {
    return this.gameTimeOfDay;
  }

  /**
   * Получить текущий день
   */
  getDay(): number {
    return Math.floor(this.gameTime / this.MINUTES_PER_DAY) + 1;
  }

  /**
   * Получить константы времени
   */
  getConstants(): {
    minutesPerDay: number;
    minutesPerTick: number;
  } {
    return {
      minutesPerDay: this.MINUTES_PER_DAY,
      minutesPerTick: this.MINUTES_PER_TICK,
    };
  }
}
