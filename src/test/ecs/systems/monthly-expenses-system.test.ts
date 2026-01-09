import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MonthlyExpensesSystem } from '../../../core/ecs/systems/clusters/population_system';
import { BitECSTestHelper } from '../../helpers/bitECS-test-helper';
import { Citizen } from '../../../core/ecs/components';

describe('MonthlyExpensesSystem', () => {
  let world: World;
  let entities: EntityId[];

  beforeEach(() => {
    ({ world, entities } = BitECSTestHelper.createTestSetup(3));
    entities.forEach(() => BitECSTestHelper.createCitizenEntity(world));
  });

  describe('timing logic', () => {
    it('should not charge expenses before 30 days', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 1000,
        minimumExpenses: 500,
        lastExpenseDay: 0,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // День 15 - еще не время платить
      MonthlyExpensesSystem.update(world, [eid], 1, 15 * 24 * 60);

      expect(Citizen.money[eid]).toBe(1000); // Деньги не списаны
      expect(Citizen.lastExpenseDay[eid]).toBe(0); // Дата не обновлена

      consoleSpy.mockRestore();
    });

    it('should charge expenses exactly on day 30', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 1000,
        minimumExpenses: 500,
        lastExpenseDay: 0,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // День 30 - время платить
      MonthlyExpensesSystem.update(world, [eid], 1, 30 * 24 * 60);

      expect(Citizen.money[eid]).toBe(500); // Списано 500
      expect(Citizen.lastExpenseDay[eid]).toBe(30); // Дата обновлена

      expect(consoleSpy).toHaveBeenCalledWith('Citizen 1 paid monthly expenses: $500');

      consoleSpy.mockRestore();
    });

    it('should charge expenses multiple times', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 2000,
        minimumExpenses: 400,
        lastExpenseDay: 0,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // День 30
      MonthlyExpensesSystem.update(world, [eid], 1, 30 * 24 * 60);
      expect(Citizen.money[eid]).toBe(1600);
      expect(Citizen.lastExpenseDay[eid]).toBe(30);

      // День 60
      MonthlyExpensesSystem.update(world, [eid], 1, 60 * 24 * 60);
      expect(Citizen.money[eid]).toBe(1200);
      expect(Citizen.lastExpenseDay[eid]).toBe(60);

      // День 90
      MonthlyExpensesSystem.update(world, [eid], 1, 90 * 24 * 60);
      expect(Citizen.money[eid]).toBe(800);
      expect(Citizen.lastExpenseDay[eid]).toBe(90);

      consoleSpy.mockRestore();
    });
  });

  describe('payment logic', () => {
    it('should handle sufficient funds', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 1000,
        minimumExpenses: 300,
        lastExpenseDay: 0,
        happiness: 80,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      MonthlyExpensesSystem.update(world, [eid], 1, 30 * 24 * 60);

      expect(Citizen.money[eid]).toBe(700); // 1000 - 300
      expect(Citizen.happiness[eid]).toBe(80); // Счастье не изменилось
      expect(consoleSpy).toHaveBeenCalledWith('Citizen 1 paid monthly expenses: $300');

      consoleSpy.mockRestore();
    });

    it('should handle insufficient funds', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 200,  // Недостаточно
        minimumExpenses: 500,
        lastExpenseDay: 0,
        happiness: 80,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      MonthlyExpensesSystem.update(world, [eid], 1, 30 * 24 * 60);

      expect(Citizen.money[eid]).toBe(0); // Все деньги списаны
      expect(Citizen.happiness[eid]).toBe(65); // Счастье уменьшено на 15
      expect(consoleSpy).toHaveBeenCalledWith('Citizen 1 couldn\'t afford monthly expenses: $500, only had $200');

      consoleSpy.mockRestore();
    });

    it('should not reduce happiness below 0', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 0,
        minimumExpenses: 100,
        lastExpenseDay: 0,
        happiness: 10, // Низкое счастье
      });

      MonthlyExpensesSystem.update(world, [eid], 1, 30 * 24 * 60);

      expect(Citizen.happiness[eid]).toBe(0); // Не меньше 0
    });

    it('should handle zero expenses', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 1000,
        minimumExpenses: 0,
        lastExpenseDay: 0,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      MonthlyExpensesSystem.update(world, [eid], 1, 30 * 24 * 60);

      expect(Citizen.money[eid]).toBe(1000); // Деньги не списаны
      expect(consoleSpy).toHaveBeenCalledWith('Citizen 1 paid monthly expenses: $0');

      consoleSpy.mockRestore();
    });
  });

  describe('multiple citizens', () => {
    it('should handle multiple citizens with different payment dates', () => {
      const eid1 = entities[0];
      const eid2 = entities[1];

      BitECSTestHelper.setCitizenData(eid1, {
        money: 1000,
        minimumExpenses: 200,
        lastExpenseDay: 0,
      });

      BitECSTestHelper.setCitizenData(eid2, {
        money: 1000,
        minimumExpenses: 300,
        lastExpenseDay: 15, // Уже платил позже
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // День 30 - первый платит, второй еще не должен
      MonthlyExpensesSystem.update(world, [eid1, eid2], 1, 30 * 24 * 60);

      expect(Citizen.money[eid1]).toBe(800); // 1000 - 200
      expect(Citizen.lastExpenseDay[eid1]).toBe(30);

      expect(Citizen.money[eid2]).toBe(1000); // Не изменилось
      expect(Citizen.lastExpenseDay[eid2]).toBe(15);

      // День 45 - второй платит
      MonthlyExpensesSystem.update(world, [eid1, eid2], 1, 45 * 24 * 60);

      expect(Citizen.money[eid2]).toBe(700); // 1000 - 300
      expect(Citizen.lastExpenseDay[eid2]).toBe(45);

      consoleSpy.mockRestore();
    });

    it('should handle mixed success/failure scenarios', () => {
      const eid1 = entities[0]; // Достаточно денег
      const eid2 = entities[1]; // Недостаточно денег
      const eid3 = entities[2]; // Нулевые расходы

      BitECSTestHelper.setCitizenData(eid1, {
        money: 1000,
        minimumExpenses: 200,
        lastExpenseDay: 0,
        happiness: 80,
      });

      BitECSTestHelper.setCitizenData(eid2, {
        money: 100,
        minimumExpenses: 300,
        lastExpenseDay: 0,
        happiness: 70,
      });

      BitECSTestHelper.setCitizenData(eid3, {
        money: 500,
        minimumExpenses: 0,
        lastExpenseDay: 0,
        happiness: 60,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      MonthlyExpensesSystem.update(world, [eid1, eid2, eid3], 1, 30 * 24 * 60);

      // Первый успешно платит
      expect(Citizen.money[eid1]).toBe(800);
      expect(Citizen.happiness[eid1]).toBe(80);

      // Второй не может заплатить полностью
      expect(Citizen.money[eid2]).toBe(0);
      expect(Citizen.happiness[eid2]).toBe(55); // 70 - 15

      // Третий платит 0
      expect(Citizen.money[eid3]).toBe(500);
      expect(Citizen.happiness[eid3]).toBe(60);

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle missing gameTime', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 1000,
        minimumExpenses: 500,
        lastExpenseDay: 0,
      });

      expect(() => {
        MonthlyExpensesSystem.update(world, [eid], 1, undefined);
        MonthlyExpensesSystem.update(world, [eid], 1);
      }).not.toThrow();

      // Ничего не должно измениться
      expect(Citizen.money[eid]).toBe(1000);
      expect(Citizen.lastExpenseDay[eid]).toBe(0);
    });

    it('should handle empty entity list', () => {
      expect(() => {
        MonthlyExpensesSystem.update(world, [], 1, 30 * 24 * 60);
      }).not.toThrow();
    });

    it('should handle undefined minimumExpenses', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 1000,
        minimumExpenses: undefined, // или 0
        lastExpenseDay: 0,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      MonthlyExpensesSystem.update(world, [eid], 1, 30 * 24 * 60);

      expect(Citizen.money[eid]).toBe(1000); // Ничего не списано
      expect(consoleSpy).toHaveBeenCalledWith('Citizen 1 paid monthly expenses: $0');

      consoleSpy.mockRestore();
    });

    it('should handle undefined money', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: undefined, // или 0
        minimumExpenses: 500,
        lastExpenseDay: 0,
        happiness: 80,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      MonthlyExpensesSystem.update(world, [eid], 1, 30 * 24 * 60);

      expect(Citizen.money[eid]).toBe(0); // Все списано
      expect(Citizen.happiness[eid]).toBe(65); // Счастье уменьшено
      expect(consoleSpy).toHaveBeenCalledWith('Citizen 1 couldn\'t afford monthly expenses: $500, only had $0');

      consoleSpy.mockRestore();
    });

    it('should handle fractional days', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 1000,
        minimumExpenses: 300,
        lastExpenseDay: 0,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Дробное время должно правильно конвертироваться
      MonthlyExpensesSystem.update(world, [eid], 1, 30.7 * 24 * 60); // 30.7 дней

      expect(Citizen.money[eid]).toBe(700); // Списано
      expect(Citizen.lastExpenseDay[eid]).toBe(30); // floor(30.7) = 30

      consoleSpy.mockRestore();
    });
  });
});
