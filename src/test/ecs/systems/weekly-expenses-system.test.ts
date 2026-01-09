import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WeeklyExpensesSystem } from '../../../core/ecs/systems/clusters/population_system';
import { BitECSTestHelper } from '../../helpers/bitECS-test-helper';
import { Citizen } from '../../../core/ecs/components';
import { EntityId, World } from 'bitecs';

describe('WeeklyExpensesSystem', () => {
  let world: World;
  let entities: EntityId[];

  beforeEach(() => {
    ({ world, entities } = BitECSTestHelper.createTestSetup(3));
    entities.forEach(() => BitECSTestHelper.createCitizenEntity(world));
  });

  describe('timing logic', () => {
    it('should not charge expenses before 7 days', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 1000,
        minimumExpenses: 100, // Недельные расходы
        lastExpenseDay: 0,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // День 3 - еще не время платить
      WeeklyExpensesSystem.update(world, [eid], 1, 3 * 24 * 60);

      expect(Citizen.money[eid]).toBe(1000); // Деньги не списаны
      expect(Citizen.lastExpenseDay[eid]).toBe(0); // Дата не обновлена

      consoleSpy.mockRestore();
    });

    it('should charge expenses exactly on day 7', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 1000,
        minimumExpenses: 100, // Недельные расходы
        lastExpenseDay: 0,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // День 8 (7 * 24 * 60 = 10080 минут = начало дня 8)
      WeeklyExpensesSystem.update(world, [eid], 1, 7 * 24 * 60);

      expect(Citizen.money[eid]).toBe(900); // Списано 100
      expect(Citizen.lastExpenseDay[eid]).toBe(8); // Дата обновлена

      expect(consoleSpy).toHaveBeenNthCalledWith(5, 'Citizen 1 paid weekly expenses: $100.00');

      consoleSpy.mockRestore();
    });

    it('should charge expenses multiple times', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 2000,
        minimumExpenses: 100, // Недельные расходы
        lastExpenseDay: 0,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // День 8 (7 * 24 * 60 = 10080 минут = начало дня 8)
      WeeklyExpensesSystem.update(world, [eid], 1, 7 * 24 * 60);
      expect(Citizen.money[eid]).toBe(1900); // 2000 - 100
      expect(Citizen.lastExpenseDay[eid]).toBe(8);

      // День 15 (14 * 24 * 60 = 20160 минут = начало дня 15)
      WeeklyExpensesSystem.update(world, [eid], 1, 14 * 24 * 60);
      expect(Citizen.money[eid]).toBe(1800); // 1900 - 100
      expect(Citizen.lastExpenseDay[eid]).toBe(15);

      // День 22 (21 * 24 * 60 = 30240 минут = начало дня 22)
      WeeklyExpensesSystem.update(world, [eid], 1, 21 * 24 * 60);
      expect(Citizen.money[eid]).toBe(1700); // 1800 - 100
      expect(Citizen.lastExpenseDay[eid]).toBe(22);

      consoleSpy.mockRestore();
    });
  });

  describe('payment logic', () => {
    it('должен обрабатывать sufficient funds', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 1000,
        minimumExpenses: 75, // Недельные расходы
        lastExpenseDay: 0,
        happiness: 80,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      WeeklyExpensesSystem.update(world, [eid], 1, 7 * 24 * 60);

      expect(Citizen.money[eid]).toBe(925); // 1000 - 75
      expect(Citizen.happiness[eid]).toBe(80); // Счастье не изменилось
      expect(consoleSpy).toHaveBeenCalledWith('Citizen 1 paid weekly expenses: $300.00');

      consoleSpy.mockRestore();
    });

    it('должен обрабатывать insufficient funds', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 50, // Недостаточно
        minimumExpenses: 125, // Недельные расходы
        lastExpenseDay: 0,
        happiness: 80,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      WeeklyExpensesSystem.update(world, [eid], 1, 7 * 24 * 60);

      expect(Citizen.money[eid]).toBe(0); // Все деньги списаны
      expect(Citizen.happiness[eid]).toBe(65); // Счастье уменьшено на 15
      expect(consoleSpy).toHaveBeenCalledWith(
        "Citizen 1 couldn't afford weekly expenses: $125.00, only had $50",
      );

      consoleSpy.mockRestore();
    });

    it('should not reduce happiness below 0', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 0,
        minimumExpenses: 25, // Недельные расходы
        lastExpenseDay: 0,
        happiness: 10, // Низкое счастье
      });

      WeeklyExpensesSystem.update(world, [eid], 1, 7 * 24 * 60);

      expect(Citizen.happiness[eid]).toBe(0); // Не меньше 0
    });

    it('должен обрабатывать zero expenses', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 1000,
        minimumExpenses: 0,
        lastExpenseDay: 0,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      WeeklyExpensesSystem.update(world, [eid], 1, 7 * 24 * 60);

      expect(Citizen.money[eid]).toBe(1000); // Деньги не списаны
      expect(consoleSpy).toHaveBeenNthCalledWith(5, 'Citizen 1 paid weekly expenses: $0.00');

      consoleSpy.mockRestore();
    });
  });

  describe('multiple citizens', () => {
    it('должен обрабатывать multiple citizens with different payment dates', () => {
      const eid1 = entities[0];
      const eid2 = entities[1];

      BitECSTestHelper.setCitizenData(eid1, {
        money: 1000,
        minimumExpenses: 50, // Недельные расходы на жилье + еду
        lastExpenseDay: 0,
      });

      BitECSTestHelper.setCitizenData(eid2, {
        money: 1000,
        minimumExpenses: 75, // Недельные расходы на жилье + еду
        lastExpenseDay: 15, // Уже платил позже
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // День 8 (7 * 24 * 60 = 10080 минут = начало дня 8) - первый платит, второй еще не должен
      WeeklyExpensesSystem.update(world, [eid1, eid2], 1, 7 * 24 * 60);

      expect(Citizen.money[eid1]).toBe(950); // 1000 - 50
      expect(Citizen.lastExpenseDay[eid1]).toBe(8);

      expect(Citizen.money[eid2]).toBe(1000); // Не изменилось
      expect(Citizen.lastExpenseDay[eid2]).toBe(15);

      // День 15 (14 * 24 * 60 = 20160 минут = начало дня 15) - второй платит
      WeeklyExpensesSystem.update(world, [eid1, eid2], 1, 14 * 24 * 60);

      expect(Citizen.money[eid2]).toBe(925); // 1000 - 75
      expect(Citizen.lastExpenseDay[eid2]).toBe(15);

      consoleSpy.mockRestore();
    });

    it('должен обрабатывать mixed success/failure scenarios', () => {
      const eid1 = entities[0]; // Достаточно денег
      const eid2 = entities[1]; // Недостаточно денег
      const eid3 = entities[2]; // Нулевые расходы

      BitECSTestHelper.setCitizenData(eid1, {
        money: 1000,
        minimumExpenses: 50, // Недельные расходы
        lastExpenseDay: 0,
        happiness: 80,
      });

      BitECSTestHelper.setCitizenData(eid2, {
        money: 25, // Недостаточно
        minimumExpenses: 75, // Недельные расходы
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

      WeeklyExpensesSystem.update(world, [eid1, eid2, eid3], 1, 7 * 24 * 60);

      // Первый успешно платит
      expect(Citizen.money[eid1]).toBe(950); // 1000 - 50
      expect(Citizen.happiness[eid1]).toBe(80);

      // Второй не может заплатить полностью
      expect(Citizen.money[eid2]).toBe(0); // 25 - 25 (не хватает на полную сумму)
      expect(Citizen.happiness[eid2]).toBe(55); // 70 - 15

      // Третий платит 0
      expect(Citizen.money[eid3]).toBe(500);
      expect(Citizen.happiness[eid3]).toBe(60);

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('должен обрабатывать missing gameTime', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 1000,
        minimumExpenses: 500,
        lastExpenseDay: 0,
      });

      expect(() => {
        WeeklyExpensesSystem.update(world, [eid], 1, undefined);
        WeeklyExpensesSystem.update(world, [eid], 1);
      }).not.toThrow();

      // Ничего не должно измениться
      expect(Citizen.money[eid]).toBe(1000);
      expect(Citizen.lastExpenseDay[eid]).toBe(0);
    });

    it('должен обрабатывать empty entity list', () => {
      expect(() => {
        WeeklyExpensesSystem.update(world, [], 1, 7 * 24 * 60);
      }).not.toThrow();
    });

    it('должен обрабатывать undefined minimumExpenses', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 1000,
        minimumExpenses: undefined, // или 0 - недельные расходы
        lastExpenseDay: 0,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      WeeklyExpensesSystem.update(world, [eid], 1, 7 * 24 * 60);

      expect(Citizen.money[eid]).toBe(1000); // Ничего не списано
      expect(consoleSpy).toHaveBeenNthCalledWith(5, 'Citizen 1 paid weekly expenses: $0.00');

      consoleSpy.mockRestore();
    });

    it('должен обрабатывать undefined money', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: undefined, // или 0
        minimumExpenses: 125, // Недельные расходы
        lastExpenseDay: 0,
        happiness: 80,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      WeeklyExpensesSystem.update(world, [eid], 1, 7 * 24 * 60);

      expect(Citizen.money[eid]).toBe(0); // Все списано
      expect(Citizen.happiness[eid]).toBe(65); // Счастье уменьшено
      expect(consoleSpy).toHaveBeenCalledWith(
        "Citizen 1 couldn't afford weekly expenses: $125.00, only had $0",
      );

      consoleSpy.mockRestore();
    });

    it('должен обрабатывать fractional days', () => {
      const eid = entities[0];

      BitECSTestHelper.setCitizenData(eid, {
        money: 1000,
        minimumExpenses: 75, // Недельные расходы
        lastExpenseDay: 0,
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Дробное время должно правильно конвертироваться
      WeeklyExpensesSystem.update(world, [eid], 1, 7.7 * 24 * 60); // 7.7 дней

      expect(Citizen.money[eid]).toBe(925); // 1000 - 75 списано
      expect(Citizen.lastExpenseDay[eid]).toBe(8); // floor(7.7) + 1 = 8

      consoleSpy.mockRestore();
    });
  });
});
