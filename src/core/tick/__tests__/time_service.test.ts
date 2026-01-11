import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimeService } from '../time_service';
import { TimeConditions } from '../types';
import { EventBus } from '../../event_bus/event_bus';
import { Events } from '../../event_bus/events';

/**
 * Тесты для TimeService - централизованного сервиса игрового времени
 */
describe('TimeService', () => {
  let mockEventBus: EventBus;
  let timeService: TimeService;

  beforeEach(() => {
    // Создаем мок EventBus для каждого теста
    mockEventBus = {
      emit: vi.fn(),
      on: vi.fn(() => () => {}),
      off: vi.fn(),
      once: vi.fn(() => () => {}),
      clear: vi.fn(),
      getListenerCount: vi.fn(() => 0),
      emitLegacy: vi.fn(),
      onLegacy: vi.fn(() => ({ unsubscribe: () => {} })),
      clearEvents: vi.fn(),
    } as unknown as EventBus;

    timeService = new TimeService(mockEventBus);
  });

  describe('Инициализация', () => {
    it('должен инициализироваться с правильными начальными значениями', () => {
      expect(timeService.getTick()).toBe(0);
      expect(timeService.getTime()).toBe(8 * 60); // 8:00 по умолчанию
      expect(timeService.getWeek()).toBe(1);
    });

    it('должен позволять устанавливать начальное время', () => {
      const customTimeService = new TimeService(mockEventBus, 12 * 60); // 12:00
      expect(customTimeService.getTime()).toBe(12 * 60);
    });

    it('должен работать с фиксированным приростом времени за тик', () => {
      // Теперь TimeService использует фиксированный GAME_TIME_PER_TICK
      const initialTime = timeService.getTime();
      timeService.tick();
      // GAME_TIME_PER_TICK = 28800ms = 28800/1000/60 = 0.48 минут
      const expectedIncrement = 28800 / 1000 / 60;
      expect(timeService.getTime()).toBe(initialTime + expectedIncrement);
    });
  });

  describe('tick() - основной метод тика', () => {
    it('должен увеличивать tick counter', () => {
      expect(timeService.getTick()).toBe(0);
      timeService.tick();
      expect(timeService.getTick()).toBe(1);
      timeService.tick();
      expect(timeService.getTick()).toBe(2);
    });

    it('должен увеличивать игровое время на фиксированную величину за тик', () => {
      const initialTime = timeService.getTime();
      timeService.tick();
      // GAME_TIME_PER_TICK = 28800ms = 28800/1000/60 = 0.48 минут
      const expectedIncrement = 28800 / 1000 / 60;
      expect(timeService.getTime()).toBeCloseTo(initialTime + expectedIncrement, 10);
    });

    it('должен эмитить событие GameTimeUpdated при каждом тике', () => {
      timeService.tick();

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        Events.GameTimeUpdated,
        expect.objectContaining({
          totalMinutes: expect.any(Number),
          timeOfDay: expect.any(String),
          date: expect.any(String),
        }),
      );
    });
  });

  describe('getTimeData() - получение данных времени', () => {
    it('должен возвращать корректные данные для начального времени (8:00)', () => {
      const timeData = timeService.getTimeData();

      expect(timeData.totalMinutes).toBe(8 * 60);
      expect(timeData.minutesOfDay).toBe(8 * 60);
      expect(timeData.timeOfDay).toBe('08:00');
      expect(timeData.day).toBe(1);
      expect(timeData.hour).toBe(8);
      expect(timeData.minute).toBe(0);
    });

    it('должен правильно рассчитывать время после нескольких тиков', () => {
      // 10 тиков с GAME_TIME_PER_TICK = 28800ms = 10 * (28800/1000/60) = 10 * 0.48 = 4.8 минут
      for (let i = 0; i < 10; i++) {
        timeService.tick();
      }

      const timeData = timeService.getTimeData();
      const expectedIncrement = 10 * (28800 / 1000 / 60); // 4.8 минут
      const expectedTotalMinutes = 8 * 60 + expectedIncrement; // 480 + 4.8 = 484.8

      expect(timeData.totalMinutes).toBeCloseTo(expectedTotalMinutes, 5);
      expect(timeData.timeOfDay).toBe('08:04'); // Прошло 4.8 минут, так что 08:04
      expect(timeData.minute).toBe(4);
    });

    it('должен правильно переходить на следующий день', () => {
      // Устанавливаем время очень близко к концу дня
      timeService.setTime(23 * 60 + 59.9); // 23:59.9

      // Один тик прибавляет 28800/1000/60 = 0.48 минуты
      // Так что перейдет на следующий день (23:59.9 + 0.48 = 00:00.38)
      timeService.tick();

      const timeData = timeService.getTimeData();
      expect(timeData.day).toBe(2); // Следующий день
      expect(timeData.timeOfDay).toBe('00:00'); // Округлено до целых минут
      expect(timeData.hour).toBe(0);
      expect(timeData.minute).toBe(0);
    });
  });

  describe('setTime() - установка времени', () => {
    it('должен устанавливать время в допустимых пределах', () => {
      timeService.setTime(12 * 60); // 12:00
      expect(timeService.getTime()).toBe(12 * 60);

      timeService.setTime(365 * 24 * 60); // Максимум
      expect(timeService.getTime()).toBe(365 * 24 * 60);
    });

    it('должен ограничивать время минимальным значением', () => {
      timeService.setTime(-100);
      expect(timeService.getTime()).toBe(0);
    });

    it('должен ограничивать время максимальным значением', () => {
      timeService.setTime(365 * 24 * 60 + 10000);
      expect(timeService.getTime()).toBe(365 * 24 * 60);
    });
  });

  describe('Вспомогательные геттеры', () => {
    it('getHour() должен возвращать текущий час', () => {
      timeService.setTime(15 * 60 + 30); // 15:30
      expect(timeService.getHour()).toBe(15);

      timeService.setTime(0); // 00:00
      expect(timeService.getHour()).toBe(0);
    });

    it('getMinutesOfDay() должен возвращать минуты от начала дня', () => {
      timeService.setTime(2 * 24 * 60 + 5 * 60 + 45); // День 3, 5:45
      expect(timeService.getMinutesOfDay()).toBe(5 * 60 + 45);
    });

    it('getDay() должен возвращать номер дня', () => {
      expect(timeService.getDay()).toBe(1);

      timeService.setTime(24 * 60); // Следующий день
      expect(timeService.getDay()).toBe(2);
    });
  });

  describe('Проверки условий времени', () => {
    describe('isMorningTime()', () => {
      it('должен возвращать true для времени 6:00-11:59', () => {
        const morningHours = [6, 7, 8, 9, 10, 11];

        morningHours.forEach((hour) => {
          timeService.setTime(hour * 60);
          expect(timeService.isMorningTime()).toBe(true);
        });
      });

      it('должен возвращать false для времени вне 6:00-11:59', () => {
        const nonMorningHours = [0, 5, 12, 18, 23];

        nonMorningHours.forEach((hour) => {
          timeService.setTime(hour * 60);
          expect(timeService.isMorningTime()).toBe(false);
        });
      });
    });

    describe('isAfternoonTime()', () => {
      it('должен возвращать true для времени 12:00-17:59', () => {
        const afternoonHours = [12, 13, 14, 15, 16, 17];

        afternoonHours.forEach((hour) => {
          timeService.setTime(hour * 60);
          expect(timeService.isAfternoonTime()).toBe(true);
        });
      });

      it('должен возвращать false для времени вне 12:00-17:59', () => {
        const nonAfternoonHours = [0, 11, 18, 23];

        nonAfternoonHours.forEach((hour) => {
          timeService.setTime(hour * 60);
          expect(timeService.isAfternoonTime()).toBe(false);
        });
      });
    });

    describe('isEveningTime()', () => {
      it('должен возвращать true для времени 18:00-21:59', () => {
        const eveningHours = [18, 19, 20, 21];

        eveningHours.forEach((hour) => {
          timeService.setTime(hour * 60);
          expect(timeService.isEveningTime()).toBe(true);
        });
      });

      it('должен возвращать false для времени вне 18:00-21:59', () => {
        const nonEveningHours = [0, 17, 22, 23];

        nonEveningHours.forEach((hour) => {
          timeService.setTime(hour * 60);
          expect(timeService.isEveningTime()).toBe(false);
        });
      });
    });

    describe('isNightTime()', () => {
      it('должен возвращать true для времени 22:00-5:59', () => {
        const nightHours = [22, 23, 0, 1, 2, 3, 4, 5];

        nightHours.forEach((hour) => {
          timeService.setTime(hour * 60);
          expect(timeService.isNightTime()).toBe(true);
        });
      });

      it('должен возвращать false для времени вне 22:00-5:59', () => {
        const nonNightHours = [6, 12, 18, 21];

        nonNightHours.forEach((hour) => {
          timeService.setTime(hour * 60);
          expect(timeService.isNightTime()).toBe(false);
        });
      });
    });

    describe('isWorkHours()', () => {
      it('должен возвращать true для времени 9:00-16:59', () => {
        const workHours = [9, 10, 11, 12, 13, 14, 15, 16];

        workHours.forEach((hour) => {
          timeService.setTime(hour * 60);
          expect(timeService.isWorkHours()).toBe(true);
        });
      });

      it('должен возвращать false для времени вне 9:00-16:59', () => {
        const nonWorkHours = [0, 8, 17, 18, 23];

        nonWorkHours.forEach((hour) => {
          timeService.setTime(hour * 60);
          expect(timeService.isWorkHours()).toBe(false);
        });
      });
    });

    describe('isFiringTime()', () => {
      it('должен возвращать true для времени 18:00-19:59', () => {
        const firingHours = [18, 19];

        firingHours.forEach((hour) => {
          timeService.setTime(hour * 60);
          expect(timeService.isFiringTime()).toBe(true);
        });
      });

      it('должен возвращать false для времени вне 18:00-19:59', () => {
        const nonFiringHours = [0, 17, 20, 23];

        nonFiringHours.forEach((hour) => {
          timeService.setTime(hour * 60);
          expect(timeService.isFiringTime()).toBe(false);
        });
      });
    });
  });

  describe('isWeekend()', () => {
    it('должен возвращать true для субботы и воскресенья', () => {
      // День 1 = понедельник (1), день 7 = воскресенье (0), день 8 = понедельник (1)
      // День 6 = суббота (6), день 7 = воскресенье (0)

      timeService.setTime((6 - 1) * 24 * 60); // День 6 = суббота
      expect(timeService.isWeekend()).toBe(true);

      timeService.setTime((7 - 1) * 24 * 60); // День 7 = воскресенье
      expect(timeService.isWeekend()).toBe(true);
    });

    it('должен возвращать false для будней', () => {
      const weekdays = [1, 2, 3, 4, 5]; // Понедельник - пятница

      weekdays.forEach((day) => {
        timeService.setTime((day - 1) * 24 * 60);
        expect(timeService.isWeekend()).toBe(false);
      });
    });
  });

  describe('getDayOfWeek()', () => {
    it('должен правильно рассчитывать день недели', () => {
      // День 1 = понедельник (1)
      timeService.setTime(0);
      expect(timeService.getDayOfWeek()).toBe(1);

      // День 2 = вторник (2)
      timeService.setTime(1 * 24 * 60);
      expect(timeService.getDayOfWeek()).toBe(2);

      // День 7 = воскресенье (0)
      timeService.setTime(6 * 24 * 60);
      expect(timeService.getDayOfWeek()).toBe(0);

      // День 8 = понедельник (1)
      timeService.setTime(7 * 24 * 60);
      expect(timeService.getDayOfWeek()).toBe(1);
    });
  });

  describe('getCurrentTimeCondition()', () => {
    it('должен возвращать правильное условие времени для каждого периода', () => {
      const testCases = [
        { hour: 8, expected: TimeConditions.MORNING },
        { hour: 14, expected: TimeConditions.AFTERNOON },
        { hour: 19, expected: TimeConditions.EVENING },
        { hour: 2, expected: TimeConditions.NIGHT },
      ];

      testCases.forEach(({ hour, expected }) => {
        timeService.setTime(hour * 60);
        expect(timeService.getCurrentTimeCondition()).toBe(expected);
      });
    });
  });

  describe('matchesCondition()', () => {
    it('должен правильно проверять соответствие всем условиям', () => {
      const testCases = [
        { hour: 8, condition: TimeConditions.MORNING, expected: true },
        { hour: 8, condition: TimeConditions.AFTERNOON, expected: false },
        { hour: 14, condition: TimeConditions.AFTERNOON, expected: true },
        { hour: 14, condition: TimeConditions.MORNING, expected: false },
        { hour: 10, condition: TimeConditions.WORK_HOURS, expected: true },
        { hour: 18, condition: TimeConditions.WORK_HOURS, expected: false },
        { hour: 18, condition: TimeConditions.FIRING_TIME, expected: true },
        { hour: 20, condition: TimeConditions.FIRING_TIME, expected: false },
      ];

      testCases.forEach(({ hour, condition, expected }) => {
        timeService.setTime(hour * 60);
        expect(timeService.matchesCondition(condition)).toBe(expected);
      });
    });
  });

  describe('getDebugInfo()', () => {
    it('должен возвращать полную отладочную информацию', () => {
      timeService.setTime(9 * 60 + 30); // 9:30

      const debugInfo = timeService.getDebugInfo();

      expect(debugInfo).toEqual({
        totalMinutes: 9 * 60 + 30,
        timeOfDay: '09:30',
        date: '01.01.2000',
        day: 1,
        hour: 9,
        minute: 30,
        condition: TimeConditions.MORNING,
        isWorkHours: true,
        isWeekend: false,
      });
    });
  });

  describe('toString()', () => {
    it('должен возвращать читаемое строковое представление времени', () => {
      timeService.setTime(15 * 60 + 45); // 15:45
      expect(timeService.toString()).toBe('15:45 Day 1 (01.01.2000)');

      timeService.setTime(25 * 60); // Следующий день, 1:00
      expect(timeService.toString()).toBe('01:00 Day 2 (02.01.2000)');
    });
  });

  describe('createTestInstance() - статический метод', () => {
    it('должен создавать тестовый экземпляр с mock EventBus', () => {
      const testInstance = TimeService.createTestInstance(12 * 60); // 12:00

      expect(testInstance.getTime()).toBe(12 * 60);
      expect(testInstance.getTick()).toBe(0);

      // Проверяем что можно вызывать tick без реального EventBus
      expect(() => testInstance.tick()).not.toThrow();
    });

    it('должен использовать время по умолчанию если не указано', () => {
      const testInstance = TimeService.createTestInstance();
      expect(testInstance.getTime()).toBe(8 * 60); // 8:00 по умолчанию
    });
  });
});
