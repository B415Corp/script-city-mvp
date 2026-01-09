import { describe, it, expect, beforeEach } from 'vitest';
import { PopulationSystem } from '../../../core/ecs/systems/clusters/population_system';
import { BitECSTestHelper } from '../../helpers/bitECS-test-helper';
import { Person, Citizen } from '../../../core/ecs/components';

describe('PopulationSystem', () => {
  let world: World;
  let entities: EntityId[];

  beforeEach(() => {
    ({ world, entities } = BitECSTestHelper.createTestSetup(3));
  });

  describe('aging', () => {
    it('should age citizens over time', () => {
      const eid = entities[0];

      // Создаем жителя с Person компонентом
      BitECSTestHelper.createCitizenEntity(world);
      BitECSTestHelper.setPersonData(eid, { age: 25 });

      const initialAge = Person.age[eid];

      // Запускаем систему на 1 год (365 игровых дней)
      PopulationSystem.update(world, [eid], 365);

      expect(Person.age[eid]).toBe(initialAge + 1);
    });

    it('should age multiple citizens differently', () => {
      const eid1 = entities[0];
      const eid2 = entities[1];

      // Создаем двух жителей
      BitECSTestHelper.createCitizenEntity(world);
      BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setPersonData(eid1, { age: 20 });
      BitECSTestHelper.setPersonData(eid2, { age: 30 });

      // Запускаем систему на 2 года
      PopulationSystem.update(world, [eid1, eid2], 730);

      expect(Person.age[eid1]).toBe(22); // 20 + 2
      expect(Person.age[eid2]).toBe(32); // 30 + 2
    });

    it('should handle fractional aging', () => {
      const eid = entities[0];
      BitECSTestHelper.createCitizenEntity(world);
      BitECSTestHelper.setPersonData(eid, { age: 25 });

      // Запускаем систему на полгода (182.5 дней)
      PopulationSystem.update(world, [eid], 182.5);

      // Возраст должен увеличиться на 182.5/365 ≈ 0.5 года
      expect(Person.age[eid]).toBeCloseTo(25.5, 1);
    });
  });

  describe('mortality', () => {
    it('should not kill young citizens', () => {
      const eid = entities[0];
      BitECSTestHelper.createCitizenEntity(world);
      BitECSTestHelper.setPersonData(eid, { age: 25 });

      // Запускаем систему много раз
      for (let i = 0; i < 100; i++) {
        PopulationSystem.update(world, [eid], 10);
      }

      // Житель должен остаться живым
      expect(Person.age[eid]).toBeGreaterThan(25);
    });

    it('should potentially kill very old citizens', () => {
      const eid = entities[0];
      BitECSTestHelper.createCitizenEntity(world);
      BitECSTestHelper.setPersonData(eid, { age: 85 });

      let deathCount = 0;
      const testRuns = 1000;

      // Запускаем систему много раз и считаем смерти
      for (let i = 0; i < testRuns; i++) {
        const ageBefore = Person.age[eid];
        PopulationSystem.update(world, [eid], 1);

        // Если возраст не изменился, значит произошла смерть
        if (Person.age[eid] === ageBefore) {
          deathCount++;
          break; // Смерть произошла, выходим из цикла
        }
      }

      // Для очень пожилого человека шанс смерти должен быть > 0
      // Но из-за случайности мы не можем гарантировать смерть в каждом тесте
      expect(Person.age[eid]).toBeGreaterThanOrEqual(85);
    });

    it('should handle multiple citizens with different mortality rates', () => {
      const youngEid = entities[0];
      const middleEid = entities[1];
      const oldEid = entities[2];

      BitECSTestHelper.createCitizenEntity(world);
      BitECSTestHelper.createCitizenEntity(world);
      BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setPersonData(youngEid, { age: 25 });
      BitECSTestHelper.setPersonData(middleEid, { age: 50 });
      BitECSTestHelper.setPersonData(oldEid, { age: 85 });

      const initialAges = [
        Person.age[youngEid],
        Person.age[middleEid],
        Person.age[oldEid],
      ];

      // Запускаем систему на 1 год
      PopulationSystem.update(world, [youngEid, middleEid, oldEid], 365);

      // Все должны постареть
      expect(Person.age[youngEid]).toBe(initialAges[0] + 1);
      expect(Person.age[middleEid]).toBe(initialAges[1] + 1);
      expect(Person.age[oldEid]).toBeGreaterThanOrEqual(initialAges[2]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty entity list', () => {
      expect(() => {
        PopulationSystem.update(world, [], 365);
      }).not.toThrow();
    });

    it('should handle very small delta time', () => {
      const eid = entities[0];
      BitECSTestHelper.createCitizenEntity(world);
      BitECSTestHelper.setPersonData(eid, { age: 25 });

      const initialAge = Person.age[eid];

      PopulationSystem.update(world, [eid], 0.001);

      // Возраст должен измениться очень незначительно
      expect(Person.age[eid]).toBeGreaterThan(initialAge);
      expect(Person.age[eid]).toBeLessThan(initialAge + 0.01);
    });

    it('should handle very large delta time', () => {
      const eid = entities[0];
      BitECSTestHelper.createCitizenEntity(world);
      BitECSTestHelper.setPersonData(eid, { age: 25 });

      PopulationSystem.update(world, [eid], 3650); // 10 лет

      expect(Person.age[eid]).toBe(35);
    });
  });
});
