import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DayNightCycleSystem } from '../../../core/ecs/systems/clusters/day_night_cycle_system';
import { BitECSTestHelper, TestEventBus } from '../../helpers/bitECS-test-helper';
import { Schedule, EntityType, DayPhase, DEFAULT_SCHEDULES } from '../../../core/ecs/components';

describe('Система цикла дня и ночи (DayNightCycleSystem)', () => {
  let world: World;
  let entities: EntityId[];
  let eventBus: TestEventBus;
  let system: DayNightCycleSystem;

  beforeEach(() => {
    ({ world, entities } = BitECSTestHelper.createTestSetup(2));
    eventBus = new TestEventBus();
    system = new DayNightCycleSystem(eventBus);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Базовая инициализация', () => {
    it('система должна быть определена с правильными свойствами', () => {
      expect(system).toBeDefined();
      expect(system.name).toBe('DayNightCycle');
      expect(system.components).toEqual(['Schedule']);
      expect(typeof system.update).toBe('function');
    });

    it('система должна корректно инициализироваться с eventBus', () => {
      const newSystem = new DayNightCycleSystem(eventBus);
      expect(newSystem['eventBus']).toBe(eventBus);
      expect(newSystem['currentPhase']).toBe('dawn');
    });
  });

  describe('Определение фазы дня', () => {
    it('должен корректно определять фазу "dawn" (рассвет)', () => {
      // 00:00 - 06:00 = 0-360 минут
      expect(system['getDayPhase'](0)).toBe('dawn');    // 00:00
      expect(system['getDayPhase'](180)).toBe('dawn'); // 03:00
      expect(system['getDayPhase'](359)).toBe('dawn'); // 05:59
    });

    it('должен корректно определять фазу "morning" (утро)', () => {
      // 06:00 - 12:00 = 360-720 минут
      expect(system['getDayPhase'](360)).toBe('morning'); // 06:00
      expect(system['getDayPhase'](540)).toBe('morning'); // 09:00
      expect(system['getDayPhase'](719)).toBe('morning'); // 11:59
    });

    it('должен корректно определять фазу "day" (день)', () => {
      // 12:00 - 18:00 = 720-1080 минут
      expect(system['getDayPhase'](720)).toBe('day');   // 12:00
      expect(system['getDayPhase'](900)).toBe('day');   // 15:00
      expect(system['getDayPhase'](1079)).toBe('day');  // 17:59
    });

    it('должен корректно определять фазу "evening" (вечер)', () => {
      // 18:00 - 22:00 = 1080-1320 минут
      expect(system['getDayPhase'](1080)).toBe('evening'); // 18:00
      expect(system['getDayPhase'](1200)).toBe('evening'); // 20:00
      expect(system['getDayPhase'](1319)).toBe('evening'); // 21:59
    });

    it('должен корректно определять фазу "night" (ночь)', () => {
      // 22:00 - 24:00 = 1320-1440 минут
      expect(system['getDayPhase'](1320)).toBe('night'); // 22:00
      expect(system['getDayPhase'](1380)).toBe('night'); // 23:00
      expect(system['getDayPhase'](1439)).toBe('night'); // 23:59
    });
  });

  describe('Получение следующей фазы', () => {
    it('должен правильно возвращать следующую фазу дня', () => {
      expect(system['getNextPhase']('dawn')).toBe('morning');
      expect(system['getNextPhase']('morning')).toBe('day');
      expect(system['getNextPhase']('day')).toBe('evening');
      expect(system['getNextPhase']('evening')).toBe('night');
      expect(system['getNextPhase']('night')).toBe('dawn');
    });
  });

  describe('Форматирование времени', () => {
    it('должен корректно форматировать время', () => {
      expect(system['formatTime'](0)).toBe('00:00');
      expect(system['formatTime'](60)).toBe('01:00');
      expect(system['formatTime'](90)).toBe('01:30');
      expect(system['formatTime'](726)).toBe('12:06'); // 12*60 + 6 = 726
      expect(system['formatTime'](1439)).toBe('23:59'); // 23*60 + 59 = 1439
    });
  });

  describe('Инициализация расписания сущности', () => {
    it('должен инициализировать расписание для гражданина', () => {
      const eid = entities[0];

      system.initializeEntitySchedule(eid, 'citizen');

      expect(Schedule.phaseSchedule[eid]).toEqual(DEFAULT_SCHEDULES.citizen);
      expect(Schedule.entityType[eid]).toBe('citizen');
      expect(Schedule.modifiers[eid]).toEqual([]);
      expect(Schedule.currentActivity[eid]).toBe('');
      expect(Schedule.nextActivityTime[eid]).toBe(0);
    });

    it('не должен инициализировать расписание для неизвестного типа', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const eid = entities[0];

      system.initializeEntitySchedule(eid, 'unknown' as EntityType);

      expect(Schedule.phaseSchedule[eid]).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('No default schedule found for entity type: unknown');

      consoleSpy.mockRestore();
    });
  });

  describe('Добавление и удаление модификаторов расписания', () => {
    it('должен добавлять модификатор расписания', () => {
      const eid = entities[0];
      system.initializeEntitySchedule(eid, 'citizen');

      const modifier = {
        type: 'delay' as const,
        condition: 'tired',
        value: 30,
        priority: 1,
      };

      system.addScheduleModifier(eid, modifier);

      expect(Schedule.modifiers[eid]).toContain(modifier);
      expect(Schedule.modifiers[eid]).toHaveLength(1);
    });

    it('должен удалять модификатор по условию', () => {
      const eid = entities[0];
      system.initializeEntitySchedule(eid, 'citizen');

      const modifier1 = {
        type: 'delay' as const,
        condition: 'tired',
        value: 30,
        priority: 1,
      };

      const modifier2 = {
        type: 'speed_up' as const,
        condition: 'urgent',
        value: 0.5,
        priority: 2,
      };

      system.addScheduleModifier(eid, modifier1);
      system.addScheduleModifier(eid, modifier2);

      expect(Schedule.modifiers[eid]).toHaveLength(2);

      system.removeScheduleModifier(eid, 'tired');

      expect(Schedule.modifiers[eid]).toHaveLength(1);
      expect(Schedule.modifiers[eid]).not.toContain(modifier1);
      expect(Schedule.modifiers[eid]).toContain(modifier2);
    });
  });

  describe('Проверка условий модификаторов', () => {
    it('должен возвращать true для условия "always"', () => {
      expect(system['checkModifierCondition'](entities[0], 'always')).toBe(true);
    });

    it('должен возвращать false для условия "never"', () => {
      expect(system['checkModifierCondition'](entities[0], 'never')).toBe(false);
    });

    it('должен логировать неизвестное условие и возвращать false', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = system['checkModifierCondition'](entities[0], 'unknown_condition');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Unknown condition: unknown_condition');

      consoleSpy.mockRestore();
    });
  });

  describe('Применение модификаторов расписания', () => {
    it('должен применять модификатор delay', () => {
      const eid = entities[0];
      system.initializeEntitySchedule(eid, 'citizen');

      const activity = { activity: 'work', duration: 480, system: 'WorkSystem' };
      const modifier = {
        type: 'delay' as const,
        condition: 'always',
        value: 60,
      };

      Schedule.modifiers[eid] = [modifier];

      const modifiedActivity = system['applyScheduleModifiers'](eid, activity, 'day');

      expect(modifiedActivity.duration).toBe(540); // 480 + 60
      expect(modifiedActivity.activity).toBe('work');
    });

    it('должен применять модификатор speed_up', () => {
      const eid = entities[0];
      system.initializeEntitySchedule(eid, 'citizen');

      const activity = { activity: 'work', duration: 480, system: 'WorkSystem' };
      const modifier = {
        type: 'speed_up' as const,
        condition: 'always',
        value: 0.5, // Ускорение в 2 раза
      };

      Schedule.modifiers[eid] = [modifier];

      const modifiedActivity = system['applyScheduleModifiers'](eid, activity, 'day');

      expect(modifiedActivity.duration).toBe(240); // 480 * 0.5
    });

    it('должен применять модификатор skip', () => {
      const eid = entities[0];
      system.initializeEntitySchedule(eid, 'citizen');

      const activity = { activity: 'work', duration: 480, system: 'WorkSystem' };
      const modifier = {
        type: 'skip' as const,
        condition: 'always',
        value: 1,
      };

      Schedule.modifiers[eid] = [modifier];

      const modifiedActivity = system['applyScheduleModifiers'](eid, activity, 'day');

      expect(modifiedActivity.activity).toBe('idle');
      expect(modifiedActivity.system).toBeUndefined();
    });

    it('должен сортировать модификаторы по приоритету', () => {
      const eid = entities[0];
      system.initializeEntitySchedule(eid, 'citizen');

      const activity = { activity: 'work', duration: 480, system: 'WorkSystem' };

      // Сначала delay, потом speed_up с более высоким приоритетом
      const modifiers = [
        { type: 'delay' as const, condition: 'always', value: 60, priority: 1 },
        { type: 'speed_up' as const, condition: 'always', value: 0.5, priority: 2 },
      ];

      Schedule.modifiers[eid] = modifiers;

      const modifiedActivity = system['applyScheduleModifiers'](eid, activity, 'day');

      // Сначала применяется speed_up (приоритет 2), потом delay (приоритет 1)
      // 480 * 0.5 = 240, затем 240 + 60 = 300
      expect(modifiedActivity.duration).toBe(300);
    });
  });

  describe('Обновление системы', () => {
    let dateNowSpy: any;

    beforeEach(() => {
      // Мокаем Date.now для предсказуемого времени
      dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(9 * 60 * 60 * 1000); // 09:00
    });

    afterEach(() => {
      dateNowSpy.mockRestore();
    });

    it('должен обрабатывать пустой список сущностей', () => {
      expect(() => {
        system.update(world, [], 1);
      }).not.toThrow();
    });

    it('должен инициализировать расписание при первом запуске', () => {
      // Создаем новую сущность с Schedule компонентом
      const eid = BitECSTestHelper.createCitizenEntity(world);

      // Инициализируем расписание для сущности
      system.initializeEntitySchedule(eid, 'citizen');

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      system.update(world, [eid], 1);

      expect(Schedule.phaseSchedule[eid]).toBeDefined();
      expect(Schedule.currentPhase[eid]).toBe('morning'); // 09:00 = morning

      consoleSpy.mockRestore();
    });

    it('должен вызывать систему при смене фазы дня', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      // Устанавливаем начальную фазу
      system['currentPhase'] = 'dawn';
      Schedule.currentPhase[eid] = 'dawn';

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      system.update(world, [eid], 1);

      // Должны быть логи о смене фазы с dawn на morning
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Phase transition: dawn → morning')
      );

      consoleSpy.mockRestore();
    });

    it('должен отправлять событие CallSystem через EventBus', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      // Инициализируем расписание и устанавливаем начальную фазу
      system.initializeEntitySchedule(eid, 'citizen');
      system['currentPhase'] = 'dawn';
      Schedule.currentPhase[eid] = 'dawn';

      system.update(world, [eid], 1);

      // Проверяем, что событие было отправлено
      expect(eventBus.events.length).toBeGreaterThan(0);
      const callSystemEvent = eventBus.events.find(e => e.event === 'CallSystem');
      expect(callSystemEvent).toBeDefined();
      expect(callSystemEvent!.payload).toMatchObject({
        systemName: 'WakeUpSystem', // Для morning фазы
        entityId: eid,
      });
    });
  });

  describe('Обработка таймеров активности', () => {
    it('должен переходить к следующей активности по истечении времени', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      // Инициализируем расписание и устанавливаем текущую активность
      system.initializeEntitySchedule(eid, 'citizen');
      Schedule.currentActivity[eid] = 'wake_up';
      Schedule.nextActivityTime[eid] = 60; // Закончится через 60 минут

      // Мокаем время, чтобы симулировать истечение таймера (120 минут > 60)
      const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(2 * 60 * 60 * 1000); // 10:00 (120 минут)

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      system.update(world, [eid], 1);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Entity ${eid} advancing from`)
      );

      dateNowSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('Интеграционные тесты', () => {
    it('должен корректно управлять полным циклом дня для жителя', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      // Инициализируем расписание
      system.initializeEntitySchedule(eid, 'citizen');

      const eventBusSpy = vi.spyOn(eventBus, 'emit');

      // Симулируем утро (wake_up активность)
      system['currentPhase'] = 'dawn';
      vi.spyOn(Date, 'now').mockReturnValue(7 * 60 * 60 * 1000); // 07:00

      system.update(world, [eid], 1);

      expect(eventBusSpy).toHaveBeenCalledWith('CallSystem', expect.objectContaining({
        systemName: 'WakeUpSystem',
        entityId: eid,
      }));

      vi.restoreAllMocks();
    });

    it('должен корректно обрабатывать модификаторы расписания в реальном сценарии', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      // Добавляем модификатор задержки
      system.addScheduleModifier(eid, {
        type: 'delay',
        condition: 'always',
        value: 30,
        priority: 1,
      });

      // Проверяем, что модификатор применяется
      const activity = DEFAULT_SCHEDULES.citizen.morning;
      const modifiedActivity = system['applyScheduleModifiers'](eid, activity, 'morning');

      expect(modifiedActivity.duration).toBe(activity.duration + 30);
    });
  });
});
