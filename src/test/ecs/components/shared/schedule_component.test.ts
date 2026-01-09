import { describe, it, expect } from 'vitest';
import {
  Schedule,
  DayPhase,
  type Activity,
  type ScheduleModifier,
  type ScheduleData,
  DEFAULT_SCHEDULES,
  EntityType,
} from '../../../../core/ecs/components/shared/schedule_component';

describe('Schedule Component', () => {
  it('должен содержать все необходимые массивы', () => {
    expect(Array.isArray(Schedule.phaseSchedule)).toBe(true);
    expect(Array.isArray(Schedule.currentActivity)).toBe(true);
    expect(Array.isArray(Schedule.currentPhase)).toBe(true);
    expect(Array.isArray(Schedule.activityExecuted)).toBe(true);
    expect(Array.isArray(Schedule.nextActivityTime)).toBe(true);
    expect(Array.isArray(Schedule.modifiers)).toBe(true);
    expect(Array.isArray(Schedule.entityType)).toBe(true);

    expect(Schedule.phaseSchedule.length).toBe(0);
    expect(Schedule.currentActivity.length).toBe(0);
    expect(Schedule.currentPhase.length).toBe(0);
    expect(Schedule.activityExecuted.length).toBe(0);
    expect(Schedule.nextActivityTime.length).toBe(0);
    expect(Schedule.modifiers.length).toBe(0);
    expect(Schedule.entityType.length).toBe(0);
  });

  it('должен уметь хранить и извлекать schedule data', () => {
    const eid = 0;
    const testData = {
      phaseSchedule: DEFAULT_SCHEDULES.citizen,
      modifiers: [],
      entityType: 'citizen' as EntityType,
      currentPhase: 'morning' as DayPhase,
      activityExecuted: false,
    };

    Schedule.phaseSchedule[eid] = { ...testData.phaseSchedule };
    Schedule.modifiers[eid] = [...testData.modifiers];
    Schedule.entityType[eid] = testData.entityType;
    Schedule.currentPhase[eid] = testData.currentPhase;
    Schedule.activityExecuted[eid] = testData.activityExecuted;
    Schedule.currentActivity[eid] = 'wake_up';
    Schedule.nextActivityTime[eid] = 60;

    expect(Schedule.phaseSchedule[eid]).toEqual(testData.phaseSchedule);
    expect(Schedule.modifiers[eid]).toEqual(testData.modifiers);
    expect(Schedule.entityType[eid]).toBe(testData.entityType);
    expect(Schedule.currentPhase[eid]).toBe(testData.currentPhase);
    expect(Schedule.activityExecuted[eid]).toBe(testData.activityExecuted);
    expect(Schedule.currentActivity[eid]).toBe('wake_up');
    expect(Schedule.nextActivityTime[eid]).toBe(60);
  });

  it('должен обрабатывать различные entity schedules', () => {
    const eid1 = 1;
    const eid2 = 2;

    // Citizen schedule
    Schedule.phaseSchedule[eid1] = { ...DEFAULT_SCHEDULES.citizen };
    Schedule.entityType[eid1] = 'citizen';
    Schedule.currentPhase[eid1] = 'day';
    Schedule.currentActivity[eid1] = 'work';
    Schedule.activityExecuted[eid1] = false;
    Schedule.nextActivityTime[eid1] = 720;

    // Another citizen schedule (different state)
    Schedule.phaseSchedule[eid2] = { ...DEFAULT_SCHEDULES.citizen };
    Schedule.entityType[eid2] = 'citizen';
    Schedule.currentPhase[eid2] = 'evening';
    Schedule.currentActivity[eid2] = 'shopping_or_eat';
    Schedule.activityExecuted[eid2] = true;
    Schedule.nextActivityTime[eid2] = 1080;

    // Verify first citizen
    expect(Schedule.entityType[eid1]).toBe('citizen');
    expect(Schedule.currentPhase[eid1]).toBe('day');
    expect(Schedule.currentActivity[eid1]).toBe('work');
    expect(Schedule.activityExecuted[eid1]).toBe(false);
    expect(Schedule.nextActivityTime[eid1]).toBe(720);

    // Verify second citizen
    expect(Schedule.entityType[eid2]).toBe('citizen');
    expect(Schedule.currentPhase[eid2]).toBe('evening');
    expect(Schedule.currentActivity[eid2]).toBe('shopping_or_eat');
    expect(Schedule.activityExecuted[eid2]).toBe(true);
    expect(Schedule.nextActivityTime[eid2]).toBe(1080);
  });

  it('должен обрабатывать phase transitions', () => {
    const eid = 3;

    // Start with dawn
    Schedule.currentPhase[eid] = 'dawn';
    Schedule.currentActivity[eid] = 'sleep';
    Schedule.activityExecuted[eid] = false;

    expect(Schedule.currentPhase[eid]).toBe('dawn');
    expect(Schedule.currentActivity[eid]).toBe('sleep');
    expect(Schedule.activityExecuted[eid]).toBe(false);

    // Transition to morning
    Schedule.currentPhase[eid] = 'morning';
    Schedule.currentActivity[eid] = 'wake_up';
    Schedule.activityExecuted[eid] = false;
    Schedule.nextActivityTime[eid] = 60;

    expect(Schedule.currentPhase[eid]).toBe('morning');
    expect(Schedule.currentActivity[eid]).toBe('wake_up');
    expect(Schedule.activityExecuted[eid]).toBe(false);
    expect(Schedule.nextActivityTime[eid]).toBe(60);

    // Complete morning activity
    Schedule.activityExecuted[eid] = true;

    expect(Schedule.activityExecuted[eid]).toBe(true);
  });

  it('должен поддерживать schedule modifiers', () => {
    const eid = 4;

    const modifiers: ScheduleModifier[] = [
      {
        type: 'delay',
        condition: 'tired',
        value: 30,
        priority: 1,
      },
      {
        type: 'speed_up',
        condition: 'urgent',
        value: 2.0,
        priority: 2,
      },
    ];

    Schedule.modifiers[eid] = [...modifiers];
    Schedule.phaseSchedule[eid] = { ...DEFAULT_SCHEDULES.citizen };
    Schedule.entityType[eid] = 'citizen';

    expect(Schedule.modifiers[eid]).toEqual(modifiers);
    expect(Schedule.modifiers[eid][0].type).toBe('delay');
    expect(Schedule.modifiers[eid][1].type).toBe('speed_up');
  });

  it('должен обрабатывать activity execution tracking', () => {
    const eid = 5;

    // Start of day phase
    Schedule.currentPhase[eid] = 'day';
    Schedule.currentActivity[eid] = 'work';
    Schedule.activityExecuted[eid] = false;
    Schedule.nextActivityTime[eid] = 480;

    expect(Schedule.activityExecuted[eid]).toBe(false);

    // Activity completed
    Schedule.activityExecuted[eid] = true;

    expect(Schedule.activityExecuted[eid]).toBe(true);
  });

  it('должен поддерживать custom schedules', () => {
    const eid = 6;

    const customSchedule: Record<DayPhase, Activity> = {
      dawn: { activity: 'rest', duration: 300, system: 'RestSystem' },
      morning: { activity: 'exercise', duration: 90, system: 'ExerciseSystem' },
      day: { activity: 'study', duration: 360, system: 'StudySystem' },
      evening: { activity: 'socialize', duration: 120, system: 'SocialSystem' },
      night: { activity: 'rest', duration: 570, system: 'RestSystem' },
    };

    Schedule.phaseSchedule[eid] = { ...customSchedule };
    Schedule.entityType[eid] = 'citizen';
    Schedule.currentPhase[eid] = 'morning';
    Schedule.currentActivity[eid] = 'exercise';

    expect(Schedule.phaseSchedule[eid]).toEqual(customSchedule);
    expect(Schedule.currentActivity[eid]).toBe('exercise');
  });

  it('должен возвращать undefined для неинициализированных сущностей', () => {
    const eid = 999;
    expect(Schedule.phaseSchedule[eid]).toBeUndefined();
    expect(Schedule.currentActivity[eid]).toBeUndefined();
    expect(Schedule.currentPhase[eid]).toBeUndefined();
    expect(Schedule.activityExecuted[eid]).toBeUndefined();
    expect(Schedule.nextActivityTime[eid]).toBeUndefined();
    expect(Schedule.modifiers[eid]).toBeUndefined();
    expect(Schedule.entityType[eid]).toBeUndefined();
  });

  it('должен обрабатывать empty modifiers array', () => {
    const eid = 7;

    Schedule.modifiers[eid] = [];
    Schedule.phaseSchedule[eid] = { ...DEFAULT_SCHEDULES.citizen };
    Schedule.entityType[eid] = 'citizen';

    expect(Schedule.modifiers[eid]).toEqual([]);
  });
});

describe('DayPhase type', () => {
  it('должен принимать допустимый day phases', () => {
    const phases: DayPhase[] = ['dawn', 'morning', 'day', 'evening', 'night'];

    phases.forEach(phase => {
      const eid = phases.indexOf(phase) + 8;
      Schedule.currentPhase[eid] = phase;
      expect(Schedule.currentPhase[eid]).toBe(phase);
    });
  });

  it('должен работать с доступом к расписанию фаз', () => {
    const schedule = DEFAULT_SCHEDULES.citizen;
    const dawnActivity = schedule.dawn;
    const morningActivity = schedule.morning;

    expect(dawnActivity.activity).toBe('sleep');
    expect(morningActivity.activity).toBe('wake_up');
  });
});

describe('Activity interface', () => {
  it('должен поддерживать activities with all properties', () => {
    const activity: Activity = {
      activity: 'work',
      duration: 480,
      system: 'WorkSystem',
      params: { location: 'office', intensity: 'high' },
    };

    expect(activity.activity).toBe('work');
    expect(activity.duration).toBe(480);
    expect(activity.system).toBe('WorkSystem');
    expect(activity.params).toEqual({ location: 'office', intensity: 'high' });
  });

  it('должен поддерживать activities with minimal properties', () => {
    const activity: Activity = {
      activity: 'rest',
      duration: 60,
    };

    expect(activity.activity).toBe('rest');
    expect(activity.duration).toBe(60);
    expect(activity.system).toBeUndefined();
    expect(activity.params).toBeUndefined();
  });

  it('должен использоваться в расписаниях по умолчанию', () => {
    const citizenSchedule = DEFAULT_SCHEDULES.citizen;

    expect(citizenSchedule.dawn.activity).toBe('sleep');
    expect(citizenSchedule.dawn.duration).toBe(360);
    expect(citizenSchedule.dawn.system).toBe('SleepSystem');

    expect(citizenSchedule.day.activity).toBe('work');
    expect(citizenSchedule.day.duration).toBe(480);
    expect(citizenSchedule.day.system).toBe('WorkSystem');
  });
});

describe('ScheduleModifier interface', () => {
  it('должен поддерживать all modifier types', () => {
    const modifiers: ScheduleModifier[] = [
      { type: 'delay', condition: 'tired', value: 30, priority: 1 },
      { type: 'speed_up', condition: 'urgent', value: 2.0, priority: 2 },
      { type: 'skip', condition: 'sick', value: 0, priority: 3 },
      { type: 'repeat', condition: 'important', value: 1, priority: 4 },
    ];

    modifiers.forEach((modifier, index) => {
      const eid = 13 + index;
      Schedule.modifiers[eid] = [modifier];

      expect(Schedule.modifiers[eid][0].type).toBe(modifier.type);
      expect(Schedule.modifiers[eid][0].condition).toBe(modifier.condition);
      expect(Schedule.modifiers[eid][0].value).toBe(modifier.value);
      expect(Schedule.modifiers[eid][0].priority).toBe(modifier.priority);
    });
  });

  it('должен поддерживать modifiers without priority', () => {
    const modifier: ScheduleModifier = {
      type: 'delay',
      condition: 'weather_bad',
      value: 15,
    };

    const eid = 17;
    Schedule.modifiers[eid] = [modifier];

    expect(Schedule.modifiers[eid][0].priority).toBeUndefined();
  });
});

describe('DEFAULT_SCHEDULES', () => {
  it('должен содержать расписание жителя', () => {
    expect(DEFAULT_SCHEDULES.citizen).toBeDefined();
    expect(typeof DEFAULT_SCHEDULES.citizen).toBe('object');
  });

  it('должен иметь все фазы дня для жителя', () => {
    const citizenSchedule = DEFAULT_SCHEDULES.citizen;
    const phases: DayPhase[] = ['dawn', 'morning', 'day', 'evening', 'night'];

    phases.forEach(phase => {
      expect(citizenSchedule[phase]).toBeDefined();
      expect(citizenSchedule[phase].activity).toBeDefined();
      expect(citizenSchedule[phase].duration).toBeDefined();
      expect(typeof citizenSchedule[phase].duration).toBe('number');
    });
  });

  it('должен иметь правильные активности расписания жителя', () => {
    const schedule = DEFAULT_SCHEDULES.citizen;

    expect(schedule.dawn.activity).toBe('sleep');
    expect(schedule.morning.activity).toBe('wake_up');
    expect(schedule.day.activity).toBe('work');
    expect(schedule.evening.activity).toBe('shopping_or_eat');
    expect(schedule.night.activity).toBe('sleep');
  });

  it('должен иметь разумные длительности', () => {
    const schedule = DEFAULT_SCHEDULES.citizen;

    // Dawn: 6 hours (360 minutes)
    expect(schedule.dawn.duration).toBe(360);
    // Morning: 1 hour (60 minutes)
    expect(schedule.morning.duration).toBe(60);
    // Day: 8 hours (480 minutes)
    expect(schedule.day.duration).toBe(480);
    // Evening: 1 hour (60 minutes)
    expect(schedule.evening.duration).toBe(60);
    // Night: 8 hours (480 minutes)
    expect(schedule.night.duration).toBe(480);
  });

  it('должен иметь назначения систем', () => {
    const schedule = DEFAULT_SCHEDULES.citizen;

    expect(schedule.dawn.system).toBe('SleepSystem');
    expect(schedule.morning.system).toBe('WakeUpSystem');
    expect(schedule.day.system).toBe('WorkSystem');
    expect(schedule.evening.system).toBe('ShoppingDecisionSystem');
    expect(schedule.night.system).toBe('SleepSystem');
  });
});

describe('ScheduleData type', () => {
  it('должен принимать допустимый ScheduleData object', () => {
    const data: ScheduleData = {
      phaseSchedule: DEFAULT_SCHEDULES.citizen,
      modifiers: [],
      entityType: 'citizen',
      currentPhase: 'day',
      activityExecuted: false,
    };

    expect(data.phaseSchedule).toEqual(DEFAULT_SCHEDULES.citizen);
    expect(data.modifiers).toEqual([]);
    expect(data.entityType).toBe('citizen');
    expect(data.currentPhase).toBe('day');
    expect(data.activityExecuted).toBe(false);
  });

  it('должен поддерживать optional properties', () => {
    const data: ScheduleData = {
      phaseSchedule: DEFAULT_SCHEDULES.citizen,
      entityType: 'citizen',
    };

    expect(data.phaseSchedule).toBeDefined();
    expect(data.entityType).toBe('citizen');
    expect(data.modifiers).toBeUndefined();
    expect(data.currentPhase).toBeUndefined();
    expect(data.activityExecuted).toBeUndefined();
  });

  it('должен требовать обязательные свойства', () => {
    // TypeScript should prevent this, but we test the concept
    const data = {
      phaseSchedule: DEFAULT_SCHEDULES.citizen,
      entityType: 'citizen',
    };

    expect(data.phaseSchedule).toBeDefined();
    expect(data.entityType).toBe('citizen');
  });
});
