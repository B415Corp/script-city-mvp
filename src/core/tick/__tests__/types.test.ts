import { describe, it, expect } from 'vitest';
import {
  TimeConditions,
  LogicTickData,
  TickStartedPayload,
  SetSpeedPayload,
  ITimeServiceDependencies,
  TimeDebugInfo,
} from '../types';

/**
 * Тесты для типов и интерфейсов модуля tick
 */
describe('Tick Types', () => {
  describe('TimeConditions enum', () => {
    it('должен содержать все необходимые условия времени', () => {
      expect(TimeConditions.MORNING).toBe('morning');
      expect(TimeConditions.AFTERNOON).toBe('afternoon');
      expect(TimeConditions.EVENING).toBe('evening');
      expect(TimeConditions.NIGHT).toBe('night');
      expect(TimeConditions.WORK_HOURS).toBe('work_hours');
      expect(TimeConditions.FIRING_TIME).toBe('firing_time');
    });

    it('должен содержать ровно 6 условий времени', () => {
      const conditions = Object.values(TimeConditions);
      expect(conditions).toHaveLength(6);
      expect(conditions).toEqual([
        'morning',
        'afternoon',
        'evening',
        'night',
        'work_hours',
        'firing_time',
      ]);
    });

    it('должен иметь строковые значения для всех условий', () => {
      Object.values(TimeConditions).forEach((condition) => {
        expect(typeof condition).toBe('string');
        expect(condition.length).toBeGreaterThan(0);
      });
    });
  });

  describe('LogicTickData interface', () => {
    it('должен позволять создавать валидный объект LogicTickData', () => {
      const tickData: LogicTickData = {
        delta: 100,
        ticksExecuted: 1,
      };

      expect(tickData.delta).toBe(100);
      expect(tickData.ticksExecuted).toBe(1);
    });

    it('должен поддерживать различные значения delta и ticksExecuted', () => {
      const testCases = [
        { delta: 16.67, ticksExecuted: 0 },
        { delta: 100, ticksExecuted: 1 },
        { delta: 200, ticksExecuted: 2 },
        { delta: 50, ticksExecuted: 5 },
      ];

      testCases.forEach(({ delta, ticksExecuted }) => {
        const tickData: LogicTickData = { delta, ticksExecuted };
        expect(tickData.delta).toBe(delta);
        expect(tickData.ticksExecuted).toBe(ticksExecuted);
      });
    });
  });

  describe('TickStartedPayload interface', () => {
    it('должен позволять создавать валидный объект TickStartedPayload', () => {
      const payload: TickStartedPayload = {
        time: 1234567890,
        delta: 16.67,
      };

      expect(payload.time).toBe(1234567890);
      expect(payload.delta).toBe(16.67);
    });

    it('должен поддерживать различные временные значения', () => {
      const testCases = [
        { time: 0, delta: 0 },
        { time: 1000, delta: 16.67 },
        { time: 999999, delta: 33.33 },
      ];

      testCases.forEach(({ time, delta }) => {
        const payload: TickStartedPayload = { time, delta };
        expect(payload.time).toBe(time);
        expect(payload.delta).toBe(delta);
      });
    });
  });

  describe('SetSpeedPayload type', () => {
    it('должен позволять создавать валидные скорости', () => {
      const speeds: SetSpeedPayload['speed'][] = [10, 60, 240];

      speeds.forEach((speed) => {
        const payload: SetSpeedPayload = { speed };
        expect(payload.speed).toBe(speed);
      });
    });

    it('должен принимать только допустимые значения скорости', () => {
      const validSpeeds = [10, 60, 240] as const;

      validSpeeds.forEach((speed) => {
        const payload: SetSpeedPayload = { speed };
        expect([10, 60, 240]).toContain(payload.speed);
      });
    });
  });

  describe('ITimeServiceDependencies interface', () => {
    it('должен позволять создавать объект с необходимыми методами', () => {
      const mockDependencies: ITimeServiceDependencies = {
        getTimeData: () => ({
          totalMinutes: 480,
          minutesOfDay: 0,
          timeOfDay: '08:00',
          date: '01.01.2000',
          day: 1,
          year: 2000,
          month: 1,
          dayOfMonth: 1,
          hour: 8,
          minute: 0,
        }),
        setTime: (minutes: number) => {
          // mock implementation
        },
      };

      expect(typeof mockDependencies.getTimeData).toBe('function');
      expect(typeof mockDependencies.setTime).toBe('function');

      const timeData = mockDependencies.getTimeData();
      expect(timeData).toHaveProperty('totalMinutes');
      expect(timeData).toHaveProperty('timeOfDay');
    });

    it('должен позволять создавать объект без setTime метода', () => {
      const minimalDependencies: ITimeServiceDependencies = {
        getTimeData: () => ({
          totalMinutes: 480,
          minutesOfDay: 0,
          timeOfDay: '08:00',
          date: '01.01.2000',
          day: 1,
          year: 2000,
          month: 1,
          dayOfMonth: 1,
          hour: 8,
          minute: 0,
        }),
      };

      expect(typeof minimalDependencies.getTimeData).toBe('function');
      expect(minimalDependencies.setTime).toBeUndefined();
    });
  });

  describe('TimeDebugInfo interface', () => {
    it('должен позволять создавать валидный объект TimeDebugInfo', () => {
      const debugInfo: TimeDebugInfo = {
        totalMinutes: 480,
        timeOfDay: '08:00',
        date: '01.01.2000',
        day: 1,
        hour: 8,
        minute: 0,
        condition: TimeConditions.MORNING,
        isWorkHours: true,
        isWeekend: false,
      };

      expect(debugInfo.totalMinutes).toBe(480);
      expect(debugInfo.timeOfDay).toBe('08:00');
      expect(debugInfo.condition).toBe(TimeConditions.MORNING);
      expect(debugInfo.isWorkHours).toBe(true);
      expect(debugInfo.isWeekend).toBe(false);
    });

    it('должен поддерживать все условия времени в debug info', () => {
      Object.values(TimeConditions).forEach((condition) => {
        const debugInfo: TimeDebugInfo = {
          totalMinutes: 0,
          timeOfDay: '00:00',
          date: '01.01.2000',
          day: 1,
          hour: 0,
          minute: 0,
          condition,
          isWorkHours: false,
          isWeekend: false,
        };

        expect(debugInfo.condition).toBe(condition);
      });
    });
  });
});
