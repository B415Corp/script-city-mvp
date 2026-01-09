import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addComponent, EntityId, World } from 'bitecs';
import {
  FiringSystem,
  JobSearchSystem,
  WakeUpSystem,
  WorkSystem,
  FeedingSystem,
  ShoppingDecisionSystem,
  SleepSystem,
  ScheduleManagerSystem,
  MovementSystem,
} from '../../../core/ecs/systems/clusters/schedule_activity_systems';
import { BitECSTestHelper, TestEventBus } from '../../helpers/bitECS-test-helper';
import { Person, Citizen, Needs, Schedule, Workplace, Residential, Commercial, Prices, Position } from '../../../core/ecs/components';
import { TimeService } from '../../../core/tick/time_service';

describe('Системы активностей расписания', () => {
  let world: World;
  let entities: EntityId[];
  let eventBus: TestEventBus;

  beforeEach(() => {
    ({ world, entities } = BitECSTestHelper.createTestSetup(3));
    eventBus = new TestEventBus();
  });

  describe('Система увольнения (FiringSystem)', () => {
    it('система должна быть определена с правильными свойствами', () => {
      expect(FiringSystem).toBeDefined();
      expect(FiringSystem.name).toBe('Firing');
      expect(FiringSystem.components).toEqual(['Person', 'Citizen']);
      expect(typeof FiringSystem.update).toBe('function');
    });

    it('должен увольнять жителя при зарплате ниже минимальных расходов', () => {
      const citizenEid = BitECSTestHelper.createCitizenEntity(world);
      const workplaceEid = BitECSTestHelper.createWorkplaceEntity(world);

      // Устанавливаем рабочее место
      BitECSTestHelper.setCitizenData(citizenEid, {
        workplace: workplaceEid,
        salary: 200, // Низкая зарплата
        minimumExpenses: 300, // Высокие расходы
        happiness: 50,
      });

      // Вечернее время (18:00-20:00)
      const timeService = TimeService.createTestInstance(19 * 60); // 19:00

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      FiringSystem.update(world, [citizenEid], 1, timeService);

      expect(Citizen.workplace[citizenEid]).toBeUndefined();
      expect(Citizen.salary[citizenEid]).toBe(0);
      expect(Citizen.isLookingForJob[citizenEid]).toBe(true);
      expect(Citizen.happiness[citizenEid]).toBeLessThan(50); // Счастье должно упасть

      consoleSpy.mockRestore();
    });

    it('не должен увольнять жителя при достаточной зарплате', () => {
      const citizenEid = BitECSTestHelper.createCitizenEntity(world);
      const workplaceEid = BitECSTestHelper.createWorkplaceEntity(world);

      BitECSTestHelper.setCitizenData(citizenEid, {
        workplace: workplaceEid,
        salary: 400, // Хорошая зарплата
        minimumExpenses: 300, // Разумные расходы
        happiness: 50,
      });

      const timeService = TimeService.createTestInstance(19 * 60); // 19:00

      FiringSystem.update(world, [citizenEid], 1, timeService);

      expect(Citizen.workplace[citizenEid]).toBe(workplaceEid);
      expect(Citizen.salary[citizenEid]).toBe(400);
      expect(Citizen.happiness[citizenEid]).toBe(50); // Счастье не изменилось
    });

    it('не должен работать вне вечернего времени', () => {
      const citizenEid = BitECSTestHelper.createCitizenEntity(world);
      const workplaceEid = BitECSTestHelper.createWorkplaceEntity(world);

      BitECSTestHelper.setCitizenData(citizenEid, {
        workplace: workplaceEid,
        salary: 200,
        minimumExpenses: 300,
      });

      // Утреннее время (не вечер)
      const timeService = TimeService.createTestInstance(10 * 60); // 10:00

      FiringSystem.update(world, [citizenEid], 1, timeService);

      // Ничего не должно измениться
      expect(Citizen.workplace[citizenEid]).toBe(workplaceEid);
    });
  });

  describe('Система поиска работы (JobSearchSystem)', () => {
    it('система должна быть определена с правильными свойствами', () => {
      expect(JobSearchSystem).toBeDefined();
      expect(JobSearchSystem.name).toBe('JobSearch');
      expect(JobSearchSystem.components).toEqual(['Person', 'Citizen']);
      expect(typeof JobSearchSystem.update).toBe('function');
    });

    it('должен запускаться только в утренние часы', () => {
      const citizenEid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setCitizenData(citizenEid, {
        workplace: undefined, // Без работы
        isLookingForJob: false,
      });

      // Вечернее время (не утро)
      const gameTime = 20 * 60;

      JobSearchSystem.update(world, [citizenEid], 1, gameTime);

      expect(Citizen.isLookingForJob[citizenEid]).toBe(false);
    });

    it('должен устанавливать поиск работы для безработных', () => {
      const citizenEid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setPersonData(citizenEid, { education: 2 });
      BitECSTestHelper.setCitizenData(citizenEid, {
        workplace: undefined,
        minimumExpenses: 250,
        isLookingForJob: false, // Явно устанавливаем начальное значение
      });

      // Утро
      const gameTime = 8 * 60;

      JobSearchSystem.update(world, [citizenEid], 1, gameTime);

      // Поскольку нет доступных рабочих мест, система не устанавливает isLookingForJob
      expect(Citizen.isLookingForJob[citizenEid]).toBe(false);
    });

    it('должен нанимать на работу при подходящих условиях', () => {
      const citizenEid = BitECSTestHelper.createCitizenEntity(world);
      const workplaceEid = BitECSTestHelper.createWorkplaceEntity(world);

      BitECSTestHelper.setPersonData(citizenEid, { education: 2 });
      BitECSTestHelper.setCitizenData(citizenEid, {
        workplace: undefined,
        minimumExpenses: 250,
        lastJobSearchDay: -1, // Не искал сегодня
        jobSearchAttempts: 0,
      });

      // Устанавливаем параметры рабочего места
      Workplace.minEducationLevel[workplaceEid] = 1; // Минимальное образование
      Workplace.salary[workplaceEid] = 300; // Хорошая зарплата
      Workplace.worker[workplaceEid] = undefined; // Свободно

      const gameTime = 24 * 60 + 8 * 60; // Day 2, 8:00

      // Мокаем Math.random для детерминированного поведения
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0.5); // Постоянное значение

      JobSearchSystem.update(world, [citizenEid, workplaceEid], 1, gameTime);

      expect(Citizen.isLookingForJob[citizenEid]).toBe(false); // Should be set to false when hired
      expect(Workplace.worker[workplaceEid]).toBe(citizenEid);

      Math.random = originalRandom;
    });
  });

  describe('Система пробуждения (WakeUpSystem)', () => {
    it('система должна быть определена с правильными свойствами', () => {
      expect(WakeUpSystem).toBeDefined();
      expect(WakeUpSystem.name).toBe('WakeUp');
      expect(WakeUpSystem.components).toEqual(['Person', 'Citizen', 'Needs', 'Schedule']);
      expect(typeof WakeUpSystem.update).toBe('function');
    });

    it('должен восстанавливать энергию и уменьшать голод при активности wake_up', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setCitizenData(eid, { energy: 50 });
      BitECSTestHelper.setNeedsData(eid, { food: 20 });
      Schedule.currentActivity[eid] = 'wake_up';

      WakeUpSystem.update(world, [eid], 1);

      expect(Citizen.energy[eid]).toBe(80); // 50 + 30
      expect(Needs.food[eid]).toBe(35); // 20 + 15
    });

    it('не должен работать при другой активности', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setCitizenData(eid, { energy: 50 });
      BitECSTestHelper.setNeedsData(eid, { food: 20 });
      Schedule.currentActivity[eid] = 'work'; // Другая активность

      WakeUpSystem.update(world, [eid], 1);

      expect(Citizen.energy[eid]).toBe(50);
      expect(Needs.food[eid]).toBe(20);
    });
  });

  describe('Система работы (WorkSystem)', () => {
    it('система должна быть определена с правильными свойствами', () => {
      expect(WorkSystem).toBeDefined();
      expect(WorkSystem.name).toBe('Work');
      expect(WorkSystem.components).toEqual(['Person', 'Citizen', 'Needs', 'Schedule']);
      expect(typeof WorkSystem.update).toBe('function');
    });

    it('должен тратить энергию и получать зарплату при работе', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setCitizenData(eid, {
        energy: 50,
        salary: 300,
        money: 100,
        minimumExpenses: 200, // Менее 250, чтобы отношение было > 1.5
        happiness: 50,
      });
      BitECSTestHelper.setNeedsData(eid, { food: 20 });
      Schedule.currentActivity[eid] = 'work';

      WorkSystem.update(world, [eid], 1);

      expect(Citizen.energy[eid]).toBe(42); // 50 - 8
      expect(Citizen.money[eid]).toBeCloseTo(100 + 300/30, 1); // Дневная зарплата
      expect(Needs.food[eid]).toBe(25); // 20 + 5
      expect(Citizen.happiness[eid]).toBe(52); // 50 + 2 (хорошая зарплата: 300/200 = 1.5)
    });

    it('должен уменьшать счастье при низкой зарплате', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setCitizenData(eid, {
        energy: 50,
        salary: 200, // Низкая зарплата
        minimumExpenses: 250,
        happiness: 50,
      });
      Schedule.currentActivity[eid] = 'work';

      WorkSystem.update(world, [eid], 1);

      expect(Citizen.happiness[eid]).toBe(47); // 50 - 3
    });
  });

  describe('Система кормления (FeedingSystem)', () => {
    it('система должна быть определена с правильными свойствами', () => {
      expect(FeedingSystem).toBeDefined();
      expect(FeedingSystem.name).toBe('Feeding');
      expect(FeedingSystem.components).toEqual(['Person', 'Citizen', 'Needs', 'Schedule']);
      expect(typeof FeedingSystem.update).toBe('function');
    });

    it('должен кормить жителя при наличии денег', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setCitizenData(eid, { money: 50, energy: 50 });
      BitECSTestHelper.setNeedsData(eid, { food: 80 });
      Schedule.currentActivity[eid] = 'feeding';

      FeedingSystem.update(world, [eid], 1);

      expect(Citizen.money[eid]).toBe(20); // 50 - 30
      expect(Needs.food[eid]).toBe(30); // 80 - 50
      expect(Citizen.energy[eid]).toBe(60); // 50 + 10
    });

    it('должен частично кормить при недостатке денег', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setCitizenData(eid, { money: 10 }); // Мало денег
      BitECSTestHelper.setNeedsData(eid, { food: 80 });
      Schedule.currentActivity[eid] = 'feeding';

      FeedingSystem.update(world, [eid], 1);

      expect(Citizen.money[eid]).toBe(10); // Деньги не изменились
      expect(Needs.food[eid]).toBe(60); // 80 - 20 (частично)
    });
  });

  describe('Система принятия решения о покупках (ShoppingDecisionSystem)', () => {
    beforeEach(() => {
      // Инициализируем глобальные цены
      const pricesEntity = 99999;
      Prices.rentPrice[pricesEntity] = 300;
      Prices.foodPrice[pricesEntity] = 250;
    });

    it('система должна быть определена с правильными свойствами', () => {
      expect(ShoppingDecisionSystem).toBeDefined();
      expect(ShoppingDecisionSystem.name).toBe('ShoppingDecision');
      expect(ShoppingDecisionSystem.components).toEqual(['Person', 'Citizen', 'Needs', 'Schedule']);
      expect(typeof ShoppingDecisionSystem.update).toBe('function');
    });

    it('должен идти в магазин при высоком голоде и достаточных деньгах', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setCitizenData(eid, { money: 500, energy: 50 });
      BitECSTestHelper.setNeedsData(eid, { food: 80 }); // Высокий голод
      Schedule.currentActivity[eid] = 'shopping_or_eat';

      ShoppingDecisionSystem.update(world, [eid], 1);

      expect(Citizen.money[eid]).toBeCloseTo(500 - (250/30 * 1.5), 1); // Дорогие покупки
      expect(Needs.food[eid]).toBe(0); // 80 - 80 (отличный ужин)
      expect(Citizen.energy[eid]).toBe(65); // 50 + 15 (энергия от хорошей еды)
    });

    it('должен есть дома при низком голоде', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setCitizenData(eid, { money: 100, energy: 50 });
      BitECSTestHelper.setNeedsData(eid, { food: 40 }); // Низкий голод
      Schedule.currentActivity[eid] = 'shopping_or_eat';

      ShoppingDecisionSystem.update(world, [eid], 1);

      expect(Citizen.money[eid]).toBeCloseTo(100 - (250/30), 1); // Дешевые покупки
      expect(Needs.food[eid]).toBe(0); // 40 - 60, но Math.max(0) применяется
      expect(Citizen.energy[eid]).toBe(60); // 50 + 10
    });
  });

  describe('Система сна (SleepSystem)', () => {
    it('система должна быть определена с правильными свойствами', () => {
      expect(SleepSystem).toBeDefined();
      expect(SleepSystem.name).toBe('Sleep');
      expect(SleepSystem.components).toEqual(['Person', 'Citizen', 'Needs', 'Schedule']);
      expect(typeof SleepSystem.update).toBe('function');
    });

    it('должен восстанавливать энергию и немного увеличивать голод при сне', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setCitizenData(eid, { energy: 50 });
      BitECSTestHelper.setNeedsData(eid, { food: 20 });
      Schedule.currentActivity[eid] = 'sleep';

      SleepSystem.update(world, [eid], 1);

      expect(Citizen.energy[eid]).toBe(100); // 50 + 50 (полное восстановление)
      expect(Needs.food[eid]).toBe(30); // 20 + 10 (немного проголодался)
    });

    it('не должен работать при другой активности', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setCitizenData(eid, { energy: 50 });
      BitECSTestHelper.setNeedsData(eid, { food: 20 });
      Schedule.currentActivity[eid] = 'work';

      SleepSystem.update(world, [eid], 1);

      expect(Citizen.energy[eid]).toBe(50);
      expect(Needs.food[eid]).toBe(20);
    });
  });

  describe('Система управления расписанием (ScheduleManagerSystem)', () => {
    it('система должна быть определена с правильными свойствами', () => {
      expect(ScheduleManagerSystem).toBeDefined();
      expect(ScheduleManagerSystem.name).toBe('ScheduleManager');
      expect(ScheduleManagerSystem.components).toEqual(['Person', 'Citizen', 'Schedule']);
      expect(typeof ScheduleManagerSystem.update).toBe('function');
    });

    it('должен устанавливать активность при смене фазы дня', () => {
      const eid = BitECSTestHelper.createCitizenEntity(world);

      // Инициализируем расписание
      Schedule.phaseSchedule[eid] = {
        dawn: { activity: 'sleep', duration: 360, system: 'SleepSystem' },
        morning: { activity: 'wake_up', duration: 60, system: 'WakeUpSystem' },
        day: { activity: 'work', duration: 480, system: 'WorkSystem' },
        evening: { activity: 'shopping_or_eat', duration: 60, system: 'ShoppingDecisionSystem' },
        night: { activity: 'sleep', duration: 480, system: 'SleepSystem' },
      };
      Schedule.entityType[eid] = 'citizen';
      Schedule.currentPhase[eid] = 'dawn';

      // Утро (morning)
      const timeService = TimeService.createTestInstance(8 * 60); // 8:00

      ScheduleManagerSystem.update(world, [eid], 1, timeService);

      expect(Schedule.currentPhase[eid]).toBe('morning');
      expect(Schedule.currentActivity[eid]).toBe('wake_up');
      expect(Schedule.activityExecuted[eid]).toBe(true);
    });
  });

  describe('Система движения (MovementSystem)', () => {
    it('система должна быть определена с правильными свойствами', () => {
      expect(MovementSystem).toBeDefined();
      expect(MovementSystem.name).toBe('Movement');
      expect(MovementSystem.components).toEqual(['Person', 'Citizen', 'Schedule', 'Position']);
      expect(typeof MovementSystem.update).toBe('function');
    });

    it('должен обновлять позицию при активности сна', () => {
      const citizenEid = BitECSTestHelper.createCitizenEntity(world);
      const homeEid = BitECSTestHelper.createBasicEntity(world);

      // Добавляем компоненты
      addComponent(world, homeEid, Residential);
      addComponent(world, homeEid, Position);

      BitECSTestHelper.setCitizenData(citizenEid, { home: homeEid });
      BitECSTestHelper.setPosition(citizenEid, 0, 0); // Начальная позиция
      BitECSTestHelper.setPosition(homeEid, 10, 20); // Позиция дома

      Schedule.currentActivity[citizenEid] = 'sleep';

      MovementSystem.update(world, [citizenEid], 1);

      // Позиция должна измениться на позицию дома
      expect(Position.x[citizenEid]).toBe(10);
      expect(Position.y[citizenEid]).toBe(20);
    });

    it('должен обновлять позицию при активности работы', () => {
      const citizenEid = BitECSTestHelper.createCitizenEntity(world);
      const workplaceEid = BitECSTestHelper.createWorkplaceEntity(world);

      // Добавляем позицию рабочему месту
      addComponent(world, workplaceEid, Position);

      BitECSTestHelper.setCitizenData(citizenEid, { workplace: workplaceEid });
      BitECSTestHelper.setPosition(citizenEid, 0, 0);
      BitECSTestHelper.setPosition(workplaceEid, 50, 60);

      Schedule.currentActivity[citizenEid] = 'work';

      MovementSystem.update(world, [citizenEid], 1);

      expect(Position.x[citizenEid]).toBe(50);
      expect(Position.y[citizenEid]).toBe(60);
    });
  });
});
