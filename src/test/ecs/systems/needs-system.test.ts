import { describe, it, expect, beforeEach } from 'vitest';
import { NeedsSystem } from '../../../core/ecs/systems/clusters/population_system';
import { BitECSTestHelper } from '../../helpers/bitECS-test-helper';
import { Needs, Citizen } from '../../../core/ecs/components';

describe('NeedsSystem', () => {
  let world: World;
  let entities: EntityId[];

  beforeEach(() => {
    ({ world, entities } = BitECSTestHelper.createTestSetup(2));
  });

  describe('needs increase over time', () => {
    it('should increase all needs over time', () => {
      const eid = entities[0];
      BitECSTestHelper.createCitizenEntity(world);

      // Устанавливаем начальные потребности
      BitECSTestHelper.setNeedsData(eid, {
        food: 20,
        shopping: 10,
        work: 5,
        sleep: 15,
      });

      const initialNeeds = BitECSTestHelper.getNeedsData(eid);

      // Запускаем систему на 10 тиков
      NeedsSystem.update(world, [eid], 10);

      const finalNeeds = BitECSTestHelper.getNeedsData(eid);

      // Все потребности должны увеличиться
      expect(finalNeeds.food).toBeGreaterThan(initialNeeds.food);
      expect(finalNeeds.shopping).toBeGreaterThan(initialNeeds.shopping);
      expect(finalNeeds.work).toBeGreaterThan(initialNeeds.work);
      expect(finalNeeds.sleep).toBeGreaterThan(initialNeeds.sleep);
    });

    it('should cap needs at 100', () => {
      const eid = entities[0];
      BitECSTestHelper.createCitizenEntity(world);

      // Устанавливаем высокие начальные потребности
      BitECSTestHelper.setNeedsData(eid, {
        food: 95,
        shopping: 98,
        work: 92,
        sleep: 97,
      });

      // Запускаем систему на много тиков
      NeedsSystem.update(world, [eid], 50);

      const finalNeeds = BitECSTestHelper.getNeedsData(eid);

      // Все потребности должны быть <= 100
      expect(finalNeeds.food).toBeLessThanOrEqual(100);
      expect(finalNeeds.shopping).toBeLessThanOrEqual(100);
      expect(finalNeeds.work).toBeLessThanOrEqual(100);
      expect(finalNeeds.sleep).toBeLessThanOrEqual(100);
    });

    it('should increase needs at different rates', () => {
      const eid = entities[0];
      BitECSTestHelper.createCitizenEntity(world);

      BitECSTestHelper.setNeedsData(eid, {
        food: 10,
        shopping: 10,
        work: 10,
        sleep: 10,
      });

      NeedsSystem.update(world, [eid], 10);

      const finalNeeds = BitECSTestHelper.getNeedsData(eid);

      // Sleep должен расти быстрее (0.8), work медленнее (0.3)
      const sleepIncrease = finalNeeds.sleep - 10;
      const workIncrease = finalNeeds.work - 10;
      const foodIncrease = finalNeeds.food - 10;
      const shoppingIncrease = finalNeeds.shopping - 10;

      expect(sleepIncrease).toBeGreaterThan(workIncrease);
      expect(foodIncrease).toBeGreaterThan(workIncrease);
      expect(shoppingIncrease).toBeGreaterThan(workIncrease);
    });
  });

  describe('happiness impact', () => {
    it('should decrease happiness when needs are high', () => {
      const eid = entities[0];
      BitECSTestHelper.createCitizenEntity(world);

      // Высокие потребности и среднее счастье
      BitECSTestHelper.setNeedsData(eid, {
        food: 80,
        shopping: 75,
        work: 60,
        sleep: 85,
      });
      BitECSTestHelper.setCitizenData(eid, { happiness: 70 });

      const initialHappiness = Citizen.happiness[eid];

      NeedsSystem.update(world, [eid], 10);

      expect(Citizen.happiness[eid]).toBeLessThan(initialHappiness);
    });

    it('should not decrease happiness when needs are low', () => {
      const eid = entities[0];
      BitECSTestHelper.createCitizenEntity(world);

      // Низкие потребности и среднее счастье
      BitECSTestHelper.setNeedsData(eid, {
        food: 20,
        shopping: 15,
        work: 10,
        sleep: 25,
      });
      BitECSTestHelper.setCitizenData(eid, { happiness: 70 });

      const initialHappiness = Citizen.happiness[eid];

      NeedsSystem.update(world, [eid], 10);

      expect(Citizen.happiness[eid]).toBe(initialHappiness);
    });

    it('should not decrease happiness below 0', () => {
      const eid = entities[0];
      BitECSTestHelper.createCitizenEntity(world);

      // Очень высокие потребности и низкое счастье
      BitECSTestHelper.setNeedsData(eid, {
        food: 95,
        shopping: 95,
        work: 95,
        sleep: 95,
      });
      BitECSTestHelper.setCitizenData(eid, { happiness: 5 });

      // Запускаем много раз
      for (let i = 0; i < 100; i++) {
        NeedsSystem.update(world, [eid], 1);
      }

      expect(Citizen.happiness[eid]).toBeGreaterThanOrEqual(0);
    });
  });

  describe('multiple citizens', () => {
    it('должен обрабатывать multiple citizens independently', () => {
      const eid1 = entities[0];
      const eid2 = entities[1];

      BitECSTestHelper.createCitizenEntity(world);
      BitECSTestHelper.createCitizenEntity(world);

      // Разные начальные потребности
      BitECSTestHelper.setNeedsData(eid1, {
        food: 10,
        shopping: 20,
        work: 30,
        sleep: 40,
      });
      BitECSTestHelper.setNeedsData(eid2, {
        food: 50,
        shopping: 60,
        work: 70,
        sleep: 80,
      });

      const initialNeeds1 = BitECSTestHelper.getNeedsData(eid1);
      const initialNeeds2 = BitECSTestHelper.getNeedsData(eid2);

      NeedsSystem.update(world, [eid1, eid2], 5);

      const finalNeeds1 = BitECSTestHelper.getNeedsData(eid1);
      const finalNeeds2 = BitECSTestHelper.getNeedsData(eid2);

      // Оба жителя должны иметь увеличенные потребности
      expect(finalNeeds1.food).toBeGreaterThan(initialNeeds1.food);
      expect(finalNeeds2.food).toBeGreaterThan(initialNeeds2.food);

      // Но у разных жителей потребности могут быть разными
      expect(finalNeeds1.food).not.toBe(finalNeeds2.food);
    });
  });

  describe('edge cases', () => {
    it('должен обрабатывать empty entity list', () => {
      expect(() => {
        NeedsSystem.update(world, [], 10);
      }).not.toThrow();
    });

    it('должен обрабатывать zero delta time', () => {
      const eid = entities[0];
      BitECSTestHelper.createCitizenEntity(world);
      BitECSTestHelper.setNeedsData(eid, { food: 50 });

      const initialFood = Needs.food[eid];

      NeedsSystem.update(world, [eid], 0);

      // При delta = 0 потребности не должны изменяться
      expect(Needs.food[eid]).toBe(initialFood);
    });

    it('должен обрабатывать negative delta time', () => {
      const eid = entities[0];
      BitECSTestHelper.createCitizenEntity(world);
      BitECSTestHelper.setNeedsData(eid, { food: 50 });

      const initialFood = Needs.food[eid];

      NeedsSystem.update(world, [eid], -10);

      // При отрицательном delta система не должна обновляться
      expect(Needs.food[eid]).toBe(initialFood);
    });
  });
});
