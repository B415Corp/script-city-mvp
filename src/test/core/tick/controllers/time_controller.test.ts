import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimeController } from '../../../../core/tick/controllers/time_controller';
import { EventBus } from '../../../../core/event_bus/event_bus';
import { Events } from '../../../../core/event_bus/events';

describe('TimeController', () => {
  let eventBus: EventBus;
  let controller: TimeController;

  beforeEach(() => {
    eventBus = new EventBus();
    controller = new TimeController(eventBus);
  });

  describe('initialization', () => {
    it('должен инициализировать with default time (8:00)', () => {
      expect(controller.getGameTime()).toBe(8 * 60); // 8:00 = 480 minutes
      expect(controller.getGameTimeOfDay()).toBe(8 * 60);
    });

    it('должен инициализировать with custom time', () => {
      const customController = new TimeController(eventBus, 10 * 60); // 10:00
      expect(customController.getGameTime()).toBe(10 * 60);
    });
  });

  describe('time management', () => {
    it('должен устанавливать и получать игровое время', () => {
      controller.setGameTime(720); // 12:00
      expect(controller.getGameTime()).toBe(720);
    });

    it('должен устанавливать время используя метод setTime', () => {
      controller.setTime(900); // 15:00
      expect(controller.getGameTime()).toBe(900);
    });

    it('должен увеличивать время при тике', () => {
      const initialTime = controller.getGameTime();
      controller.tick();
      expect(controller.getGameTime()).toBe(initialTime + 1);
    });

    it('должен правильно рассчитывать время дня', () => {
      controller.setGameTime(480); // 8:00 Day 1
      expect(controller.getGameTimeOfDay()).toBe(480);

      controller.setGameTime(1440 + 480); // 8:00 Day 2
      expect(controller.getGameTimeOfDay()).toBe(480);
    });
  });

  describe('date calculation', () => {
    it('должен рассчитывать дату для первого дня', () => {
      controller.setGameTime(480); // 8:00 Day 1
      const timeData = controller.getTimeUpdateData();

      expect(timeData.day).toBe(1);
      expect(timeData.year).toBe(2000);
      expect(timeData.month).toBe(1);
      expect(timeData.dayOfMonth).toBe(1);
    });

    it('должен рассчитывать прогрессию даты', () => {
      controller.setGameTime(1439); // 23:59 day 1
      let timeData = controller.getTimeUpdateData();
      expect(timeData.day).toBe(1);

      controller.setGameTime(1440); // 00:00 day 2
      timeData = controller.getTimeUpdateData();
      expect(timeData.day).toBe(2);
      expect(timeData.dayOfMonth).toBe(2);
    });

    it('должен обрабатывать month transitions', () => {
      // January has 31 days, so day 32 should be February 1
      controller.setGameTime(30 * 1440); // 30 days = still January
      const timeData = controller.getTimeUpdateData();

      expect(timeData.month).toBe(1);
      expect(timeData.dayOfMonth).toBe(31);
      expect(timeData.day).toBe(31);

      controller.setGameTime(31 * 1440); // 31st day = February 1st
      const febData = controller.getTimeUpdateData();
      expect(febData.month).toBe(2);
      expect(febData.dayOfMonth).toBe(1);
      expect(febData.day).toBe(32);
    });

    it('должен обрабатывать leap years', () => {
      // 2000 is a leap year (divisible by 400)
      controller.setGameTime(366 * 1440); // 366 days (including Feb 29)
      const timeData = controller.getTimeUpdateData();

      expect(timeData.year).toBe(2001);
      expect(timeData.month).toBe(1);
      expect(timeData.dayOfMonth).toBe(1);
    });

    it('должен обрабатывать non-leap years', () => {
      // 2001 is not a leap year
      // 366 days in 2000 (leap year) + 31 days in Jan 2001 + 28 days in Feb 2001 = 425 days total
      controller.setGameTime(425 * 1440); // March 1, 2001
      const timeData = controller.getTimeUpdateData();

      expect(timeData.year).toBe(2001);
      expect(timeData.month).toBe(3);
      expect(timeData.dayOfMonth).toBe(1);
    });
  });

  describe('time formatting', () => {
    it('должен правильно форматировать время дня', () => {
      controller.setGameTime(0); // 00:00
      expect(controller.getTimeUpdateData().timeOfDay).toBe('00:00');

      controller.setGameTime(60); // 01:00
      expect(controller.getTimeUpdateData().timeOfDay).toBe('01:00');

      controller.setGameTime(90); // 01:30
      expect(controller.getTimeUpdateData().timeOfDay).toBe('01:30');

      controller.setGameTime(23 * 60 + 59); // 23:59
      expect(controller.getTimeUpdateData().timeOfDay).toBe('23:59');
    });

    it('должен правильно форматировать дату', () => {
      controller.setGameTime(0);
      const timeData = controller.getTimeUpdateData();
      expect(timeData.date).toBe('01.01.2000');

      controller.setGameTime(1440); // Next day
      const nextDayData = controller.getTimeUpdateData();
      expect(nextDayData.date).toBe('02.01.2000');
    });

    it('должен дополнять однозначные часы и минуты', () => {
      controller.setGameTime(5 * 60 + 5); // 05:05
      const timeData = controller.getTimeUpdateData();
      expect(timeData.timeOfDay).toBe('05:05');
    });
  });

  describe('emitTimeUpdate', () => {
    it('должен отправлять событие GameTimeUpdated с правильными данными', () => {
      const mockHandler = vi.fn();
      eventBus.on(Events.GameTimeUpdated, mockHandler);

      controller.setGameTime(480); // 8:00
      controller.emitTimeUpdate();

      expect(mockHandler).toHaveBeenCalledTimes(1);
      const emittedData = mockHandler.mock.calls[0][0];

      expect(emittedData.totalMinutes).toBe(480);
      expect(emittedData.timeOfDay).toBe('08:00');
      expect(emittedData.date).toBe('01.01.2000');
      expect(emittedData.day).toBe(1);
      expect(emittedData.hour).toBe(8);
      expect(emittedData.minute).toBe(0);
      expect(emittedData.minutesOfDay).toBe(480);
    });

    it('должен отправлять событие с обновленным временем после тика', () => {
      const mockHandler = vi.fn();
      eventBus.on(Events.GameTimeUpdated, mockHandler);

      controller.setGameTime(479); // 7:59
      controller.tick();
      controller.emitTimeUpdate();

      const emittedData = mockHandler.mock.calls[0][0];
      expect(emittedData.totalMinutes).toBe(480);
      expect(emittedData.timeOfDay).toBe('08:00');
    });
  });

  describe('getTimeUpdateData', () => {
    it('должен возвращать complete time data structure', () => {
      controller.setGameTime(480); // 8:00 Day 1
      const data = controller.getTimeUpdateData();

      expect(data).toEqual({
        totalMinutes: 480,
        timeOfDay: '08:00',
        date: '01.01.2000',
        day: 1,
        year: 2000,
        month: 1,
        dayOfMonth: 1,
        hour: 8,
        minute: 0,
        minutesOfDay: 480,
      });
    });

    it('должен обрабатывать различные times correctly', () => {
      controller.setGameTime(23 * 60 + 45); // 23:45 Day 1
      const data = controller.getTimeUpdateData();

      expect(data.timeOfDay).toBe('23:45');
      expect(data.hour).toBe(23);
      expect(data.minute).toBe(45);
    });
  });

  describe('getStats', () => {
    it('должен возвращать basic time statistics', () => {
      controller.setGameTime(480); // 8:00
      const stats = controller.getStats();

      expect(stats.gameTime).toBe(480);
      expect(stats.gameTimeOfDay).toBe('08:00');
      expect(stats.day).toBe(1);
    });

    it('должен обрабатывать multi-day time', () => {
      controller.setGameTime(1440 + 720); // 12:00 Day 2
      const stats = controller.getStats();

      expect(stats.gameTime).toBe(2160);
      expect(stats.gameTimeOfDay).toBe('12:00');
      expect(stats.day).toBe(2);
    });
  });

  describe('getDay', () => {
    it('должен возвращать correct day number', () => {
      controller.setGameTime(0); // Day 1
      expect(controller.getDay()).toBe(1);

      controller.setGameTime(1439); // Still day 1
      expect(controller.getDay()).toBe(1);

      controller.setGameTime(1440); // Day 2
      expect(controller.getDay()).toBe(2);
    });
  });

  describe('getConstants', () => {
    it('должен возвращать time constants', () => {
      const constants = controller.getConstants();

      expect(constants.minutesPerDay).toBe(1440);
      expect(constants.minutesPerTick).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('должен обрабатывать year transitions', () => {
      controller.setGameTime(365 * 1440); // 365 days = end of year
      const timeData = controller.getTimeUpdateData();

      expect(timeData.year).toBe(2000);
      expect(timeData.month).toBe(12);
      expect(timeData.dayOfMonth).toBe(31);

      controller.setGameTime(366 * 1440); // Start of next year
      const nextYearData = controller.getTimeUpdateData();

      expect(nextYearData.year).toBe(2001);
      expect(nextYearData.month).toBe(1);
      expect(nextYearData.dayOfMonth).toBe(1);
    });

    it('должен обрабатывать midnight correctly', () => {
      controller.setGameTime(1439); // 23:59 Day 1
      let timeData = controller.getTimeUpdateData();
      expect(timeData.timeOfDay).toBe('23:59');
      expect(timeData.day).toBe(1);

      controller.tick(); // 00:00 Day 2
      timeData = controller.getTimeUpdateData();
      expect(timeData.timeOfDay).toBe('00:00');
      expect(timeData.day).toBe(2);
    });
  });
});
