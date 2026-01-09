import { describe, it, expect, beforeEach } from 'vitest';
import { TimeService } from '../../../core/tick/time_service';
import { TimeConditions } from '../../../core/tick/types';

describe('TimeService', () => {
  let timeService: TimeService;

  beforeEach(() => {
    timeService = TimeService.createTestInstance(8 * 60); // 8:00
  });

  describe('initialization', () => {
    it('should create test instance with specified time', () => {
      const customTimeService = TimeService.createTestInstance(10 * 60); // 10:00
      expect(customTimeService.getHour()).toBe(10);
      expect(customTimeService.getMinutesOfDay()).toBe(10 * 60);
    });

    it('should default to 8:00 AM if no time specified', () => {
      const defaultService = TimeService.createTestInstance();
      expect(defaultService.getHour()).toBe(8);
      expect(defaultService.getMinutesOfDay()).toBe(8 * 60);
    });
  });

  describe('time getters', () => {
    it('should return correct hour', () => {
      expect(timeService.getHour()).toBe(8);

      timeService.setTime(15 * 60); // 15:00
      expect(timeService.getHour()).toBe(15);
    });

    it('should return correct minutes of day', () => {
      expect(timeService.getMinutesOfDay()).toBe(8 * 60);

      timeService.setTime(15 * 60 + 30); // 15:30
      expect(timeService.getMinutesOfDay()).toBe(15 * 60 + 30);
    });

    it('should return correct day', () => {
      expect(timeService.getDay()).toBe(1);

      timeService.setTime(24 * 60 + 8 * 60); // Day 2, 8:00
      expect(timeService.getDay()).toBe(2);
    });
  });

  describe('time conditions - morning', () => {
    it('should identify morning time (6:00-12:00)', () => {
      timeService.setTime(6 * 60); // 6:00
      expect(timeService.isMorningTime()).toBe(true);
      expect(timeService.getCurrentTimeCondition()).toBe(TimeConditions.MORNING);

      timeService.setTime(12 * 60 - 1); // 11:59
      expect(timeService.isMorningTime()).toBe(true);

      timeService.setTime(12 * 60); // 12:00
      expect(timeService.isMorningTime()).toBe(false);
    });
  });

  describe('time conditions - afternoon', () => {
    it('should identify afternoon time (12:00-18:00)', () => {
      timeService.setTime(12 * 60); // 12:00
      expect(timeService.isAfternoonTime()).toBe(true);
      expect(timeService.getCurrentTimeCondition()).toBe(TimeConditions.AFTERNOON);

      timeService.setTime(18 * 60 - 1); // 17:59
      expect(timeService.isAfternoonTime()).toBe(true);

      timeService.setTime(18 * 60); // 18:00
      expect(timeService.isAfternoonTime()).toBe(false);
    });
  });

  describe('time conditions - evening', () => {
    it('should identify evening time (18:00-22:00)', () => {
      timeService.setTime(18 * 60); // 18:00
      expect(timeService.isEveningTime()).toBe(true);
      expect(timeService.getCurrentTimeCondition()).toBe(TimeConditions.EVENING);

      timeService.setTime(22 * 60 - 1); // 21:59
      expect(timeService.isEveningTime()).toBe(true);

      timeService.setTime(22 * 60); // 22:00
      expect(timeService.isEveningTime()).toBe(false);
    });
  });

  describe('time conditions - night', () => {
    it('should identify night time (22:00-6:00)', () => {
      timeService.setTime(22 * 60); // 22:00
      expect(timeService.isNightTime()).toBe(true);
      expect(timeService.getCurrentTimeCondition()).toBe(TimeConditions.NIGHT);

      timeService.setTime(24 * 60 - 1); // 23:59
      expect(timeService.isNightTime()).toBe(true);

      timeService.setTime(6 * 60 - 1); // 5:59
      expect(timeService.isNightTime()).toBe(true);

      timeService.setTime(6 * 60); // 6:00
      expect(timeService.isNightTime()).toBe(false);
    });
  });

  describe('work hours', () => {
    it('should identify work hours (9:00-17:00)', () => {
      timeService.setTime(9 * 60); // 9:00
      expect(timeService.isWorkHours()).toBe(true);

      timeService.setTime(17 * 60 - 1); // 16:59
      expect(timeService.isWorkHours()).toBe(true);

      timeService.setTime(8 * 60); // 8:00
      expect(timeService.isWorkHours()).toBe(false);

      timeService.setTime(17 * 60); // 17:00
      expect(timeService.isWorkHours()).toBe(false);
    });
  });

  describe('firing time', () => {
    it('should identify firing time (18:00-20:00)', () => {
      timeService.setTime(18 * 60); // 18:00
      expect(timeService.isFiringTime()).toBe(true);

      timeService.setTime(20 * 60 - 1); // 19:59
      expect(timeService.isFiringTime()).toBe(true);

      timeService.setTime(17 * 60); // 17:00
      expect(timeService.isFiringTime()).toBe(false);

      timeService.setTime(20 * 60); // 20:00
      expect(timeService.isFiringTime()).toBe(false);
    });
  });

  describe('weekends', () => {
    it('should identify weekends (simplified)', () => {
      // Для простоты теста: пусть 7-й день = суббота (6)
      timeService.setTime(6 * 24 * 60 + 12 * 60); // Day 7, 12:00
      expect(timeService.getDayOfWeek()).toBe(0); // 0 = воскресенье в нашем расчете

      // Проверяем выходные
      expect(timeService.isWeekend()).toBe(true);
    });

    it('should identify weekdays', () => {
      timeService.setTime(2 * 24 * 60 + 12 * 60); // Day 3 (среда), 12:00
      expect(timeService.getDayOfWeek()).toBe(3); // 3 = среда
      expect(timeService.isWeekend()).toBe(false);
    });
  });

  describe('condition matching', () => {
    it('should match conditions correctly', () => {
      timeService.setTime(8 * 60); // 8:00 - morning
      expect(timeService.matchesCondition(TimeConditions.MORNING)).toBe(true);
      expect(timeService.matchesCondition(TimeConditions.AFTERNOON)).toBe(false);

      timeService.setTime(14 * 60); // 14:00 - afternoon
      expect(timeService.matchesCondition(TimeConditions.AFTERNOON)).toBe(true);
      expect(timeService.matchesCondition(TimeConditions.MORNING)).toBe(false);

      timeService.setTime(19 * 60); // 19:00 - evening/firing time
      expect(timeService.matchesCondition(TimeConditions.EVENING)).toBe(true);
      expect(timeService.matchesCondition(TimeConditions.FIRING_TIME)).toBe(true);
      expect(timeService.matchesCondition(TimeConditions.WORK_HOURS)).toBe(false);
    });
  });

  describe('debug info', () => {
    it('should provide comprehensive debug information', () => {
      timeService.setTime(19 * 60 + 30); // 19:30, evening

      const debugInfo = timeService.getDebugInfo();

      expect(debugInfo).toEqual({
        totalMinutes: 19 * 60 + 30,
        timeOfDay: '19:30',
        date: expect.any(String),
        day: expect.any(Number),
        hour: 19,
        minute: 30,
        condition: TimeConditions.EVENING,
        isWorkHours: false,
        isWeekend: expect.any(Boolean),
      });
    });
  });

  describe('string representation', () => {
    it('should format time as readable string', () => {
      timeService.setTime(15 * 60 + 45); // 15:45
      const timeString = timeService.toString();

      expect(timeString).toContain('15:45');
      expect(timeString).toContain('Day');
    });
  });

  describe('time progression', () => {
    it('should handle time progression correctly', () => {
      timeService.setTime(23 * 60 + 59); // 23:59
      expect(timeService.getHour()).toBe(23);
      expect(timeService.getMinutesOfDay()).toBe(23 * 60 + 59);

      timeService.setTime(24 * 60); // Next day, 00:00
      expect(timeService.getHour()).toBe(0);
      expect(timeService.getMinutesOfDay()).toBe(0);
      expect(timeService.getDay()).toBe(2);
    });

    it('should handle midnight transition', () => {
      timeService.setTime(24 * 60 - 1); // 23:59 Day 1
      expect(timeService.getDay()).toBe(1);

      timeService.setTime(24 * 60); // 00:00 Day 2
      expect(timeService.getDay()).toBe(2);
      expect(timeService.getMinutesOfDay()).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle midnight correctly', () => {
      timeService.setTime(0); // 00:00
      expect(timeService.isNightTime()).toBe(true);
      expect(timeService.getHour()).toBe(0);
    });

    it('should handle noon correctly', () => {
      timeService.setTime(12 * 60); // 12:00
      expect(timeService.isAfternoonTime()).toBe(true);
      expect(timeService.isMorningTime()).toBe(false);
    });

    it('should handle large times (multiple days)', () => {
      timeService.setTime(5 * 24 * 60 + 9 * 60); // Day 6, 9:00
      expect(timeService.getDay()).toBe(6);
      expect(timeService.getHour()).toBe(9);
      expect(timeService.isWorkHours()).toBe(true);
    });
  });
});
