import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld, addComponent, addEntity } from 'bitecs';
import { createPriceFluctuationSystem } from '../../../core/ecs/systems/clusters/population_system';
import {
  TestTimeProvider,
  TestRandomProvider,
  TestLogger,
  TestEventBus,
} from '../../helpers/bitECS-test-helper';
import { Prices, Person } from '../../../core/ecs/components';

describe('PriceFluctuationSystem with DI', () => {
  let priceSystem: any;
  let world: any;
  let timeProvider: TestTimeProvider;
  let logger: TestLogger;
  let eventBus: TestEventBus;
  let personEid: number;
  let PRICES_ENTITY: number; // Используем динамический ID для тестирования

  beforeEach(() => {
    world = createWorld();
    timeProvider = new TestTimeProvider();
    logger = new TestLogger();
    eventBus = new TestEventBus();

    // Создаем сущность для цен
    const eid = addEntity(world);
    addComponent(world, eid, Prices);
    PRICES_ENTITY = eid; // Используем тот же ID, что и в системе

    // Создаем сущность с компонентом Person (требуется для системы)
    personEid = addEntity(world);
    addComponent(world, personEid, Person);
    Person.age[personEid] = 25;
    Person.gender[personEid] = 1;
    Person.name[personEid] = 'Test Person';
    Person.education[personEid] = 1;

    // Создаем систему с dependency injection
    priceSystem = createPriceFluctuationSystem({
      timeProvider,
      randomProvider: new TestRandomProvider([0.5]),
      logger,
      eventBus,
      gameConfig: {
        pricesEntityId: eid, // Используем созданную сущность
        initialRentPrice: 300,
        initialFoodPrice: 250,
        priceUpdateIntervalDays: 7,
      },
    });
    console.log(
      'Created priceSystem:',
      typeof priceSystem,
      'has update:',
      typeof priceSystem?.update,
    );
    console.log('priceSystem object:', priceSystem);
  });

  describe('initialization', () => {
    it('should initialize prices on first call', () => {
      // Устанавливаем время в timeProvider
      timeProvider.setTime(8 * 60); // 8:00 AM in minutes

      console.log('About to call priceSystem.update');
      priceSystem.update(world, [], 1, 8 * 60);
      console.log('Called priceSystem.update');

      console.log('Checking prices:', {
        rentPrice: Prices.rentPrice[PRICES_ENTITY],
        foodPrice: Prices.foodPrice[PRICES_ENTITY],
        lastUpdateDay: Prices.lastUpdateDay[PRICES_ENTITY],
      });

      expect(Prices.rentPrice[PRICES_ENTITY]).toBe(300);
      expect(Prices.foodPrice[PRICES_ENTITY]).toBe(250);
      expect(Prices.lastUpdateDay[PRICES_ENTITY]).toBe(0);

      expect(logger.logs.some((log) => log.includes('Prices initialized'))).toBe(true);
    });

    it('should not reinitialize if prices already set', () => {
      // Устанавливаем цены вручную
      Prices.rentPrice[PRICES_ENTITY] = 400;
      Prices.foodPrice[PRICES_ENTITY] = 300;
      Prices.lastUpdateDay[PRICES_ENTITY] = 5;

      // Вызываем систему
      priceSystem.update(world, [personEid], 1, timeProvider.getCurrentTime());

      // Цены должны остаться без изменений
      expect(Prices.rentPrice[PRICES_ENTITY]).toBe(400);
      expect(Prices.foodPrice[PRICES_ENTITY]).toBe(300);
      expect(Prices.lastUpdateDay[PRICES_ENTITY]).toBe(5);
    });
  });

  describe('price updates', () => {
    beforeEach(() => {
      // Сбрасываем время и инициализируем цены
      timeProvider.setTime(0);
      priceSystem.update(world, [], 1, timeProvider.getCurrentTime());
      logger.logs = []; // Очищаем логи
    });

    it('should not update prices before 7 days', () => {
      // Проходит 6 дней (6 * 24 * 60 = 8640 минут)
      timeProvider.setTime(6 * 24 * 60);
      priceSystem.update(world, [personEid], 1, timeProvider.getCurrentTime());

      // Цены должны остаться без изменений
      expect(Prices.rentPrice[PRICES_ENTITY]).toBe(300);
      expect(Prices.foodPrice[PRICES_ENTITY]).toBe(250);
    });

    it('should update prices after 7 days', () => {
      // Проходит 8 дней (чтобы гарантированно пройти интервал после инициализации)
      timeProvider.setTime(8 * 24 * 60);
      priceSystem.update(world, [personEid], 1, timeProvider.getCurrentTime());

      // Цены должны измениться - lastUpdateDay должен обновиться
      expect(Prices.lastUpdateDay[PRICES_ENTITY]).toBe(8);
    });
  });
});
