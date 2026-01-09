import { TimeConditions, ITimeServiceDependencies, TimeDebugInfo } from './types';
import { GameTimeUpdateData } from '../ecs/types';
import { TimeController } from './controllers/time_controller';
import { EventBus } from '../event_bus/event_bus';
import { Events } from '../event_bus/events';

/**
 * TimeService - централизованный сервис для работы с игровым временем
 * Обеспечивает единый интерфейс для всех систем и компонентов
 *
 * Использование с eventBus:
 * ```typescript
 * // Для компонентов, которые получают время через события
 * const timeService = TimeService.createFromEventBus(eventBus);
 *
 * // Для прямого доступа к TimeController
 * const timeService = TimeService.fromTimeController(timeController);
 *
 * // Для тестирования
 * const timeService = TimeService.createTestInstance(9 * 60); // 9:00
 * ```
 */
export class TimeService {
  constructor(private dependencies: ITimeServiceDependencies) {}

  /**
   * Получить полные данные времени
   */
  getTimeData(): GameTimeUpdateData {
    return this.dependencies.getTimeData();
  }

  /**
   * Установить время (для тестов)
   */
  setTime(minutes: number): void {
    if (this.dependencies.setTime) {
      this.dependencies.setTime(minutes);
    } else {
      throw new Error('TimeService: setTime not supported in this context');
    }
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
    return this.getTimeData().day;
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
   * Создать TimeService из TimeController (для совместимости)
   */
  static fromTimeController(timeController: TimeController): TimeService {
    return new TimeService({
      getTimeData: () => timeController.getTimeUpdateData(),
      setTime: (minutes: number) => timeController.setGameTime(minutes),
    });
  }

  /**
   * Создать TimeService, который работает с eventBus
   * Автоматически подписывается на GameTimeUpdated события
   */
  static createFromEventBus(eventBus: EventBus): TimeService {
    let currentTimeData: GameTimeUpdateData | null = null;

    // Подписываемся на обновления времени
    eventBus.on(Events.GameTimeUpdated, (data) => {
      if (data) {
        currentTimeData = data as GameTimeUpdateData;
      }
    });

    return new TimeService({
      getTimeData: () => {
        if (!currentTimeData) {
          // Возвращаем данные по умолчанию, если время еще не было получено
          return {
            totalMinutes: 8 * 60, // 8:00
            timeOfDay: '08:00',
            date: '01.01.2000',
            day: 1,
            year: 2000,
            month: 1,
            dayOfMonth: 1,
            hour: 8,
            minute: 0,
            minutesOfDay: 8 * 60,
          };
        }
        return currentTimeData;
      },
      setTime: undefined, // EventBus версия не поддерживает установку времени
    });
  }

  /**
   * Создать тестовый TimeService
   */
  static createTestInstance(initialTime = 8 * 60): TimeService {
    let currentTime = initialTime;

    return new TimeService({
      getTimeData: () => {
        const totalMinutes = currentTime;
        const minutesOfDay = totalMinutes % (24 * 60);
        const day = Math.floor(totalMinutes / (24 * 60)) + 1;
        const hours = Math.floor(minutesOfDay / 60);
        const minutes = Math.floor(minutesOfDay % 60);

        // Простой расчет даты (для тестов)
        const startYear = 2000;
        const startMonth = 1;
        const startDay = 1;
        const totalDays = Math.floor(totalMinutes / (24 * 60));
        const year = startYear;
        const month = 1;
        const dayOfMonth = startDay + totalDays;

        return {
          totalMinutes,
          timeOfDay: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
          date: `${dayOfMonth.toString().padStart(2, '0')}.01.${year}`,
          day,
          year,
          month,
          dayOfMonth,
          hour: hours,
          minute: minutes,
          minutesOfDay,
        };
      },
      setTime: (minutes: number) => {
        currentTime = minutes;
      },
    });
  }
}
