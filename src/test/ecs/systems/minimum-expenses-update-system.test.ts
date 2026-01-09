import { describe, it, expect, beforeEach } from 'vitest';
import { MinimumExpensesUpdateSystem } from '../../../core/ecs/systems/clusters/population_system';
import { BitECSTestHelper } from '../../helpers/bitECS-test-helper';
import { Citizen, Prices, HousingType } from '../../../core/ecs/components';

describe('MinimumExpensesUpdateSystem', () => {
  let world: World;
  let entities: EntityId[];
  const PRICES_ENTITY = 99999;

  beforeEach(() => {
    ({ world, entities } = BitECSTestHelper.createTestSetup(3));

    // Создаем тестовые сущности с Citizen компонентом
    entities.forEach(() => BitECSTestHelper.createCitizenEntity(world));
  });

  describe('basic functionality', () => {
    it('должен обновлять minimum expenses for owned housing', () => {
      const eid = entities[0];

      // Устанавливаем цены
      BitECSTestHelper.setPricesData(PRICES_ENTITY, {
        rentPrice: 300,
        foodPrice: 250,
      });

      // Устанавливаем тип жилья как OWNED (не требует аренды)
      BitECSTestHelper.setCitizenData(eid, {
        housingType: HousingType.OWNED,
      });

      MinimumExpensesUpdateSystem.update(world, [eid], 1);

      // Минимальные расходы должны равняться только цене еды
      expect(Citizen.minimumExpenses[eid]).toBe(250);
    });

    it('должен обновлять minimum expenses for rented housing', () => {
      const eid = entities[0];

      // Устанавливаем цены
      BitECSTestHelper.setPricesData(PRICES_ENTITY, {
        rentPrice: 300,
        foodPrice: 250,
      });

      // Устанавливаем тип жилья как RENTED
      BitECSTestHelper.setCitizenData(eid, {
        housingType: HousingType.RENTED,
      });

      MinimumExpensesUpdateSystem.update(world, [eid], 1);

      // Минимальные расходы должны включать аренду + еду
      expect(Citizen.minimumExpenses[eid]).toBe(550); // 300 + 250
    });

    it('должен обрабатывать undefined housing type as owned', () => {
      const eid = entities[0];

      // Устанавливаем цены
      BitECSTestHelper.setPricesData(PRICES_ENTITY, {
        rentPrice: 300,
        foodPrice: 250,
      });

      // Не устанавливаем housingType (undefined)
      BitECSTestHelper.setCitizenData(eid, {
        // housingType: undefined (по умолчанию)
      });

      MinimumExpensesUpdateSystem.update(world, [eid], 1);

      // Должен считаться как OWNED - только еда
      expect(Citizen.minimumExpenses[eid]).toBe(250);
    });
  });

  describe('price changes', () => {
    it('should recalculate expenses when prices change', () => {
      const eid = entities[0];

      // Устанавливаем тип жилья как RENTED
      BitECSTestHelper.setCitizenData(eid, {
        housingType: HousingType.RENTED,
      });

      // Сначала низкие цены
      BitECSTestHelper.setPricesData(PRICES_ENTITY, {
        rentPrice: 200,
        foodPrice: 150,
      });

      MinimumExpensesUpdateSystem.update(world, [eid], 1);
      expect(Citizen.minimumExpenses[eid]).toBe(350); // 200 + 150

      // Меняем цены
      BitECSTestHelper.setPricesData(PRICES_ENTITY, {
        rentPrice: 400,
        foodPrice: 300,
      });

      MinimumExpensesUpdateSystem.update(world, [eid], 1);
      expect(Citizen.minimumExpenses[eid]).toBe(700); // 400 + 300
    });

    it('должен обрабатывать zero prices', () => {
      const eid = entities[0];

      BitECSTestHelper.setPricesData(PRICES_ENTITY, {
        rentPrice: 0,
        foodPrice: 0,
      });

      BitECSTestHelper.setCitizenData(eid, {
        housingType: HousingType.RENTED,
      });

      MinimumExpensesUpdateSystem.update(world, [eid], 1);

      expect(Citizen.minimumExpenses[eid]).toBe(0);
    });

    it('должен обрабатывать high prices', () => {
      const eid = entities[0];

      BitECSTestHelper.setPricesData(PRICES_ENTITY, {
        rentPrice: 10000,
        foodPrice: 5000,
      });

      BitECSTestHelper.setCitizenData(eid, {
        housingType: HousingType.RENTED,
      });

      MinimumExpensesUpdateSystem.update(world, [eid], 1);

      expect(Citizen.minimumExpenses[eid]).toBe(15000);
    });
  });

  describe('multiple citizens', () => {
    it('должен обрабатывать multiple citizens with different housing types', () => {
      const eid1 = entities[0];
      const eid2 = entities[1];
      const eid3 = entities[2];

      // Устанавливаем цены
      BitECSTestHelper.setPricesData(PRICES_ENTITY, {
        rentPrice: 300,
        foodPrice: 250,
      });

      // Разные типы жилья
      BitECSTestHelper.setCitizenData(eid1, { housingType: HousingType.OWNED });
      BitECSTestHelper.setCitizenData(eid2, { housingType: HousingType.RENTED });
      BitECSTestHelper.setCitizenData(eid3, { housingType: 0 }); // undefined как OWNED

      MinimumExpensesUpdateSystem.update(world, [eid1, eid2, eid3], 1);

      expect(Citizen.minimumExpenses[eid1]).toBe(250);  // только еда
      expect(Citizen.minimumExpenses[eid2]).toBe(550);  // аренда + еда
      expect(Citizen.minimumExpenses[eid3]).toBe(250);  // только еда
    });

    it('должен обновлять all citizens when prices change', () => {
      const eid1 = entities[0];
      const eid2 = entities[1];

      // Оба арендуют жилье
      BitECSTestHelper.setCitizenData(eid1, { housingType: HousingType.RENTED });
      BitECSTestHelper.setCitizenData(eid2, { housingType: HousingType.RENTED });

      // Изменяем цены несколько раз
      BitECSTestHelper.setPricesData(PRICES_ENTITY, { rentPrice: 200, foodPrice: 150 });
      MinimumExpensesUpdateSystem.update(world, [eid1, eid2], 1);
      expect(Citizen.minimumExpenses[eid1]).toBe(350);
      expect(Citizen.minimumExpenses[eid2]).toBe(350);

      BitECSTestHelper.setPricesData(PRICES_ENTITY, { rentPrice: 400, foodPrice: 300 });
      MinimumExpensesUpdateSystem.update(world, [eid1, eid2], 1);
      expect(Citizen.minimumExpenses[eid1]).toBe(700);
      expect(Citizen.minimumExpenses[eid2]).toBe(700);
    });
  });

  describe('edge cases', () => {
    it('should not update if prices are not initialized', () => {
      const eid = entities[0];

      // Не устанавливаем цены
      BitECSTestHelper.setCitizenData(eid, {
        housingType: HousingType.RENTED,
        minimumExpenses: 1000, // начальное значение
      });

      MinimumExpensesUpdateSystem.update(world, [eid], 1);

      // Расходы не должны измениться
      expect(Citizen.minimumExpenses[eid]).toBe(1000);
    });

    it('должен обрабатывать empty entity list', () => {
      expect(() => {
        MinimumExpensesUpdateSystem.update(world, [], 1);
      }).not.toThrow();
    });

    it('должен обрабатывать entities without Citizen component', () => {
      const basicEntity = BitECSTestHelper.createBasicEntity(world); // без Citizen

      expect(() => {
        MinimumExpensesUpdateSystem.update(world, [basicEntity], 1);
      }).not.toThrow();
    });

    it('должен обрабатывать delta parameter (system ignores it)', () => {
      const eid = entities[0];

      BitECSTestHelper.setPricesData(PRICES_ENTITY, {
        rentPrice: 300,
        foodPrice: 250,
      });
      BitECSTestHelper.setCitizenData(eid, {
        housingType: HousingType.RENTED,
      });

      // Система не использует delta, результат должен быть одинаковым
      MinimumExpensesUpdateSystem.update(world, [eid], 0);
      expect(Citizen.minimumExpenses[eid]).toBe(550);

      MinimumExpensesUpdateSystem.update(world, [eid], 1000);
      expect(Citizen.minimumExpenses[eid]).toBe(550);
    });
  });

  describe('housing type logic', () => {
    it('should correctly identify rented housing (type 1)', () => {
      const eid = entities[0];

      BitECSTestHelper.setPricesData(PRICES_ENTITY, {
        rentPrice: 300,
        foodPrice: 250,
      });

      BitECSTestHelper.setCitizenData(eid, {
        housingType: 1, // RENTED
      });

      MinimumExpensesUpdateSystem.update(world, [eid], 1);
      expect(Citizen.minimumExpenses[eid]).toBe(550);
    });

    it('should treat non-1 housing types as owned', () => {
      const eid1 = entities[0];
      const eid2 = entities[1];
      const eid3 = entities[2];

      BitECSTestHelper.setPricesData(PRICES_ENTITY, {
        rentPrice: 300,
        foodPrice: 250,
      });

      // Разные значения housingType
      BitECSTestHelper.setCitizenData(eid1, { housingType: 0 });   // OWNED
      BitECSTestHelper.setCitizenData(eid2, { housingType: 2 });   // OTHER
      BitECSTestHelper.setCitizenData(eid3, { housingType: -1 });  // INVALID

      MinimumExpensesUpdateSystem.update(world, [eid1, eid2, eid3], 1);

      // Все должны считаться OWNED - только еда
      expect(Citizen.minimumExpenses[eid1]).toBe(250);
      expect(Citizen.minimumExpenses[eid2]).toBe(250);
      expect(Citizen.minimumExpenses[eid3]).toBe(250);
    });
  });
});
