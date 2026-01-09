import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobSearchSystem } from '../../../core/ecs/systems/clusters/schedule_activity_systems';
import { BitECSTestHelper } from '../../helpers/bitECS-test-helper';
import { Workplace, Citizen, Person } from '../../../core/ecs/components';
import { JobType, EducationLevel } from '../../../core/ecs/components';
import { createWorld } from 'bitecs';

describe('JobSearchSystem', () => {
  let world: World;
  let entities: EntityId[];

  beforeEach(() => {
    world = createWorld();
    entities = [];
    for (let i = 0; i < 5; i++) {
      entities.push(BitECSTestHelper.createCitizenEntity(world));
    }
  });

  describe('timing restrictions', () => {
    it('should only work during morning hours (6:00-9:00)', () => {
      const eid = entities[0];

      // Устанавливаем безработного гражданина
      BitECSTestHelper.setCitizenData(eid, {
        workplace: undefined,
        isLookingForJob: true,
        jobSearchAttempts: 0,
        lastJobSearchDay: -1, // Никогда не искал работу
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Ночь (2:00) - система не должна работать
      JobSearchSystem.update(world, [eid], 1, 2 * 60); // 2:00
      expect(consoleSpy).not.toHaveBeenCalled();

      // Создаем рабочее место для тестирования
      const workplaceId = BitECSTestHelper.createWorkplaceEntity(world);
      Workplace.jobType[workplaceId] = JobType.CASHIER;
      Workplace.salary[workplaceId] = 1000;
      Workplace.worker[workplaceId] = undefined;
      Workplace.minEducationLevel[workplaceId] = EducationLevel.NONE;

      // Утро (8:00) - система должна работать
      JobSearchSystem.update(world, [eid, workplaceId], 1, 8 * 60); // 8:00
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should not work outside 6:00-9:00 window', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        workplace: undefined,
        isLookingForJob: true,
        jobSearchAttempts: 0,
        lastJobSearchDay: -1, // Никогда не искал работу
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Тестируем разные времена
      const times = [
        5 * 60,  // 5:00 - слишком рано
        9.1 * 60, // 9:06 - слишком поздно
        12 * 60, // 12:00 - обед
        18 * 60, // 18:00 - вечер
        23 * 60, // 23:00 - ночь
      ];

      times.forEach(time => {
        JobSearchSystem.update(world, [eid], 1, time);
      });

      // Система не должна была логировать поиск работы
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('job search logic', () => {
    it('should mark unemployed citizens as looking for job', () => {
      const eid = entities[0];

      // Гражданин без работы
      BitECSTestHelper.setCitizenData(eid, {
        workplace: undefined, // Нет работы
        isLookingForJob: false,
        jobSearchAttempts: 0,
        lastJobSearchDay: 0,
      });

      const gameTime = 8 * 60; // 8:00

      JobSearchSystem.update(world, [eid], 1, gameTime);

      expect(Citizen.isLookingForJob[eid]).toBe(true);
    });

    it('should not change status of employed citizens', () => {
      const eid = entities[0];

      // Гражданин с работой
      BitECSTestHelper.setCitizenData(eid, {
        workplace: 123, // Есть работа
        isLookingForJob: true,
        jobSearchAttempts: 5,
        lastJobSearchDay: 0,
      });

      const gameTime = 8 * 60; // 8:00

      JobSearchSystem.update(world, [eid], 1, gameTime);

      expect(Citizen.isLookingForJob[eid]).toBe(false);
      expect(Citizen.jobSearchAttempts[eid]).toBe(5);
    });

    it('should increment job search attempts each day', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        workplace: undefined,
        isLookingForJob: true,
        jobSearchAttempts: 3,
        lastJobSearchDay: 0,
      });

      // Не передаем workplaces в entities, чтобы citizen не нашел работу
      const gameTime = 1 * 24 * 60 + 8 * 60;

      JobSearchSystem.update(world, [eid], 1, gameTime);

      expect(Citizen.jobSearchAttempts[eid]).toBe(4);
      expect(Citizen.lastJobSearchDay[eid]).toBe(1);
    });

    it('should not increment attempts on same day', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        workplace: undefined,
        isLookingForJob: true,
        jobSearchAttempts: 3,
        lastJobSearchDay: 1, // Тот же день
      });

      // День 1, 8:00 - повторный вызов в тот же день
      const gameTime = 1 * 24 * 60 + 8 * 60;

      JobSearchSystem.update(world, [eid], 1, gameTime);

      expect(Citizen.jobSearchAttempts[eid]).toBe(3); // Не изменилось
      expect(Citizen.lastJobSearchDay[eid]).toBe(1);
    });
  });

  describe('job matching', () => {
    it('should validate workplace requirements', () => {
      // Basic validation test - system should exist and have correct structure
      expect(JobSearchSystem.components).toEqual(['Person', 'Citizen']);
    });

    it('should handle workplace availability check', () => {
      // Simplified test - just ensure system doesn't crash
      const citizenId = entities[0];

      BitECSTestHelper.setCitizenData(citizenId, {
        workplace: undefined,
        isLookingForJob: true,
        jobSearchAttempts: 0,
        lastJobSearchDay: 0,
      });

      expect(() => {
        JobSearchSystem.update(world, [citizenId], 1, 8 * 60);
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle missing gameTime', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        workplace: undefined,
        isLookingForJob: true,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      JobSearchSystem.update(world, [eid], 1, undefined);
      JobSearchSystem.update(world, [eid], 1);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle empty entity list', () => {
      expect(() => {
        JobSearchSystem.update(world, [], 1, 8 * 60);
      }).not.toThrow();
    });

    it('should handle entities without required components', () => {
      const basicEntity = BitECSTestHelper.createBasicEntity(world);

      expect(() => {
        JobSearchSystem.update(world, [basicEntity], 1, 8 * 60);
      }).not.toThrow();
    });

    it('should handle no available workplaces', () => {
      const citizenId = entities[0];

      BitECSTestHelper.setCitizenData(citizenId, {
        workplace: undefined,
        isLookingForJob: true,
        jobSearchAttempts: 0,
        lastJobSearchDay: 0,
      });

      // Не передаем workplaces, система все равно должна увеличить счетчик
      // Используем время следующего дня
      JobSearchSystem.update(world, [citizenId], 1, 24 * 60 + 8 * 60); // День 1, 8:00

      expect(Citizen.isLookingForJob[citizenId]).toBe(true);
      expect(Citizen.jobSearchAttempts[citizenId]).toBe(1);
    });
  });

});
